import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { SlaAlertsService } from './sla-alerts.service';

@Injectable()
export class TasksSchedulerService {
  constructor(
    private readonly tasksService: TasksService,
    private readonly slaAlertsService: SlaAlertsService,
  ) {}

  /** A cada 5 minutos, dispara alertas de SLA para tarefas em setor crítico não iniciadas em 15 min. */
  @Cron('*/5 * * * *')
  async handleSlaAlerts() {
    const count = await this.slaAlertsService.processSlaAlerts();
    if (count > 0) {
      console.log(`[TasksScheduler] ${count} alerta(s) de SLA enviado(s)`);
    }
  }

  /** A cada 10 minutos, marca tarefas atrasadas como LATE. */
  @Cron('*/10 * * * *')
  async handleMarkLateTasks() {
    const count = await this.tasksService.markLateTasks();
    if (count > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[TasksScheduler] ${count} tarefa(s) marcada(s) como LATE`);
    }
  }

  /** Diariamente às 05:00, cria tarefas automáticas baseadas em cleaning_frequency. */
  @Cron('0 5 * * *')
  async handleScheduleAutoTasks() {
    const count = await this.tasksService.scheduleAutoTasks();
    if (count > 0) {
      console.log(`[TasksScheduler] ${count} tarefa(s) agendada(s) automaticamente`);
    }
  }
}
