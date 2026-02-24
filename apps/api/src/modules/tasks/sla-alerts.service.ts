import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Task } from '../../entities/task.entity';
import { Area } from '../../entities/area.entity';
import { SlaAlert } from '../../entities/sla-alert.entity';

const SLA_MINUTES = 15;
const RISK_CRITICO = 'crítico';

@Injectable()
export class SlaAlertsService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
    @InjectRepository(SlaAlert)
    private readonly slaAlertRepo: Repository<SlaAlert>,
  ) {}

  /**
   * Processa alertas de SLA: tarefas em setor crítico não iniciadas em até 15 min após o horário programado.
   * Dispara notificação (Email/Push) e registra em sla_alerts.
   */
  async processSlaAlerts(): Promise<number> {
    const now = new Date();
    const deadline = new Date(now.getTime() - SLA_MINUTES * 60 * 1000);

    const tasks = await this.taskRepo
      .createQueryBuilder('t')
      .innerJoin('t.area', 'a')
      .where('t.status = :status', { status: 'PENDING' })
      .andWhere('a.riskClassification = :risk', { risk: RISK_CRITICO })
      .andWhere('t.sla_alerted_at IS NULL')
      .andWhere('t.scheduled_time IS NOT NULL')
      .select(['t.id', 't.scheduledDate', 't.scheduledTime', 't.areaId', 't.employeeId'])
      .getMany();

    let alerted = 0;
    for (const task of tasks) {
      const scheduledDate = new Date(task.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      const [h, m] = (task.scheduledTime ?? '00:00').split(':').map(Number);
      const scheduledAt = new Date(scheduledDate);
      scheduledAt.setHours(h, m, 0, 0);
      const slaDeadline = new Date(scheduledAt.getTime() + SLA_MINUTES * 60 * 1000);

      if (now <= slaDeadline) continue;

      const minutesLate = Math.floor((now.getTime() - slaDeadline.getTime()) / 60000);

      const alert = this.slaAlertRepo.create({
        id: uuid(),
        taskId: task.id,
        alertType: 'SLA_ATRASO_SETOR_CRITICO',
        minutesLate,
        notificationSent: false,
        notificationChannel: null,
      });
      await this.slaAlertRepo.save(alert);

      await this.taskRepo.update(task.id, { slaAlertedAt: now });

      await this.sendSlaNotification(task.id, minutesLate);

      await this.slaAlertRepo.update(alert.id, {
        notificationSent: true,
        notificationChannel: 'EMAIL',
      });

      alerted++;
    }
    return alerted;
  }

  private async sendSlaNotification(taskId: string, minutesLate: number): Promise<void> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['area', 'employee'],
    });
    if (!task) return;

    const areaName = task.area?.name ?? 'Área';
    const empName = task.employee?.name ?? 'Não atribuído';

    if (process.env.SMTP_HOST && process.env.SLA_ALERT_EMAIL) {
      try {
        await this.sendEmailAlert(process.env.SLA_ALERT_EMAIL, {
          taskId,
          areaName,
          empName,
          minutesLate,
        });
      } catch (e) {
        console.error('[SLA] Erro ao enviar email:', e);
      }
    } else {
      console.log(
        `[SLA] Alerta: Tarefa ${taskId} (${areaName}) atrasada ${minutesLate} min. Email não configurado (SMTP_HOST/SLA_ALERT_EMAIL).`,
      );
    }
  }

  private async sendEmailAlert(
    to: string,
    data: { taskId: string; areaName: string; empName: string; minutesLate: number },
  ): Promise<void> {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'sigeo@localhost',
      to,
      subject: `[SIGEO] Alerta SLA: Limpeza em setor crítico atrasada (${data.minutesLate} min)`,
      text: `Tarefa ${data.taskId} na área "${data.areaName}" não foi iniciada em até 15 minutos após o horário programado.\nFuncionário: ${data.empName}\nAtraso: ${data.minutesLate} minutos.`,
      html: `<p><strong>Alerta SLA - Setor Crítico</strong></p><p>Tarefa ${data.taskId} na área "${data.areaName}" não foi iniciada em até 15 minutos após o horário programado.</p><p>Funcionário: ${data.empName}</p><p>Atraso: ${data.minutesLate} minutos.</p>`,
    });
  }
}
