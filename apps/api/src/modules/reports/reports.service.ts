import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { existsSync } from 'fs';
import { join } from 'path';
import { AuditLog } from '../../entities/audit-log.entity';
import { Task } from '../../entities/task.entity';
import { TaskPhoto } from '../../entities/task-photo.entity';

const LOGO_PATH = process.env.LOGO_PATH ?? join(process.cwd(), 'public', 'logo.png');

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskPhoto)
    private readonly photoRepo: Repository<TaskPhoto>,
  ) {}

  async generateAuditPdf(from: Date, to: Date): Promise<Buffer> {
    const logs = await this.auditRepo.find({
      where: { createdAt: Between(from, to) },
      order: { createdAt: 'DESC' },
      take: 500,
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      if (existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, 50, 50, { width: 80 });
        doc.moveDown(4);
      }
      doc.fontSize(18).text('Relatório de Auditoria - SIGEO', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Período: ${from.toLocaleDateString('pt-BR')} a ${to.toLocaleDateString('pt-BR')}`);
      doc.moveDown(2);

      doc.fontSize(10);
      for (const log of logs) {
        doc.text(
          `${log.createdAt.toLocaleString('pt-BR')} | ${log.action} | ${log.entity} | ${log.entityId ?? '-'}`,
          { width: 500 },
        );
        doc.moveDown(0.5);
      }

      doc.end();
    });
  }

  async generateAuditExcel(from: Date, to: Date): Promise<Buffer> {
    const logs = await this.auditRepo.find({
      where: { createdAt: Between(from, to) },
      order: { createdAt: 'DESC' },
      take: 2000,
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Auditoria');
    ws.columns = [
      { header: 'Data/Hora', key: 'createdAt', width: 20 },
      { header: 'Ação', key: 'action', width: 12 },
      { header: 'Entidade', key: 'entity', width: 15 },
      { header: 'ID', key: 'entityId', width: 38 },
      { header: 'Payload', key: 'payload', width: 40 },
    ];
    ws.addRows(
      logs.map((l) => ({
        createdAt: l.createdAt.toLocaleString('pt-BR'),
        action: l.action,
        entity: l.entity,
        entityId: l.entityId ?? '',
        payload: l.payload ? JSON.stringify(l.payload) : '',
      })),
    );
    ws.getRow(1).font = { bold: true };

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async generateProductivityPdf(from: Date, to: Date): Promise<Buffer> {
    const tasks = await this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.area', 'a')
      .leftJoinAndSelect('t.employee', 'e')
      .where('t.scheduled_date >= :from', { from })
      .andWhere('t.scheduled_date <= :to', { to })
      .orderBy('t.scheduled_date', 'DESC')
      .addOrderBy('t.created_at', 'DESC')
      .take(300)
      .getMany();

    const byStatus = tasks.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalEstimated = tasks.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);
    const totalSpent = tasks.reduce((s, t) => {
      const start = t.startedAt;
      const end = t.completedAt;
      if (start && end) return s + (end.getTime() - start.getTime()) / 60000;
      return s;
    }, 0);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      if (existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, 50, 50, { width: 80 });
        doc.moveDown(4);
      }
      doc.fontSize(18).text('Relatório de Produtividade - SIGEO', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Período: ${from.toLocaleDateString('pt-BR')} a ${to.toLocaleDateString('pt-BR')}`);
      doc.moveDown();
      doc.text(`Total de tarefas: ${tasks.length}`);
      doc.text(`Por status: ${JSON.stringify(byStatus)}`);
      doc.text(`Tempo estimado total: ${Math.round(totalEstimated)} min`);
      doc.text(`Tempo gasto total (completadas): ${Math.round(totalSpent)} min`);
      doc.moveDown(2);

      doc.fontSize(10);
      for (const t of tasks) {
        const area = t.area?.name ?? '-';
        const emp = t.employee?.name ?? '-';
        const est = t.estimatedMinutes ?? '-';
        const spent =
          t.startedAt && t.completedAt
            ? Math.round((t.completedAt.getTime() - t.startedAt.getTime()) / 60000)
            : '-';
        doc.text(
          `${new Date(t.scheduledDate).toLocaleDateString('pt-BR')} | ${t.status} | ${area} | ${emp} | Est: ${est}min | Gasto: ${spent}min`,
          { width: 500 },
        );
        doc.moveDown(0.5);
      }

      doc.end();
    });
  }

  async generateProductivityExcel(from: Date, to: Date): Promise<Buffer> {
    const tasks = await this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.area', 'a')
      .leftJoinAndSelect('t.employee', 'e')
      .where('t.scheduled_date >= :from', { from })
      .andWhere('t.scheduled_date <= :to', { to })
      .orderBy('t.scheduled_date', 'DESC')
      .take(2000)
      .getMany();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Produtividade');
    ws.columns = [
      { header: 'Data', key: 'scheduledDate', width: 12 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Área', key: 'areaName', width: 25 },
      { header: 'Funcionário', key: 'employeeName', width: 25 },
      { header: 'Título', key: 'title', width: 30 },
    ];
    ws.addRows(
      tasks.map((t) => ({
        scheduledDate: new Date(t.scheduledDate).toLocaleDateString('pt-BR'),
        status: t.status,
        areaName: t.area?.name ?? '',
        employeeName: t.employee?.name ?? '',
        title: t.title ?? '',
      })),
    );
    ws.getRow(1).font = { bold: true };

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  /**
   * Relatório de Visita Digital: PDF assinado para cliente/auditoria com fotos antes/depois,
   * geolocalização exata e tempo de permanência no local.
   */
  async generateVisitReportPdf(taskId: string): Promise<Buffer> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['area', 'employee'],
    });
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    const photos = await this.photoRepo.find({
      where: { taskId },
      order: { type: 'ASC', createdAt: 'ASC' },
    });
    const beforePhotos = photos.filter((p) => p.type === 'BEFORE');
    const afterPhotos = photos.filter((p) => p.type === 'AFTER');

    const permanenceMinutes =
      task.startedAt && task.completedAt
        ? Math.round((task.completedAt.getTime() - task.startedAt.getTime()) / 60000)
        : null;

    const fetchImageBuffers = async (list: TaskPhoto[]): Promise<(Buffer | null)[]> => {
      return Promise.all(
        list.map(async (p) => {
          try {
            const res = await fetch(p.url);
            return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
          } catch {
            return null;
          }
        }),
      );
    };
    const [beforeBuffers, afterBuffers] = await Promise.all([
      fetchImageBuffers(beforePhotos),
      fetchImageBuffers(afterPhotos),
    ]);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      if (existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, 50, 50, { width: 80 });
        doc.moveDown(4);
      }
      doc.fontSize(18).text('Relatório de Visita Digital - SIGEO', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Tarefa: ${task.title ?? task.area?.name ?? taskId}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(10);
      doc.text(`Data agendada: ${new Date(task.scheduledDate).toLocaleDateString('pt-BR')}`);
      doc.text(`Área: ${task.area?.name ?? '-'}`);
      doc.text(`Funcionário: ${task.employee?.name ?? '-'}`);
      doc.text(`Status: ${task.status}`);
      if (task.startedAt) {
        doc.text(`Início: ${task.startedAt.toLocaleString('pt-BR')}`);
      }
      if (task.completedAt) {
        doc.text(`Conclusão: ${task.completedAt.toLocaleString('pt-BR')}`);
      }
      if (permanenceMinutes !== null) {
        doc.text(`Tempo de permanência: ${permanenceMinutes} minutos`);
      }
      doc.moveDown();

      if (task.checkinLat != null && task.checkinLng != null) {
        doc.text(`Geolocalização check-in: ${task.checkinLat.toFixed(6)}, ${task.checkinLng.toFixed(6)}`);
      }
      if (task.checkoutLat != null && task.checkoutLng != null) {
        doc.text(`Geolocalização check-out: ${task.checkoutLat.toFixed(6)}, ${task.checkoutLng.toFixed(6)}`);
      }
      doc.moveDown(2);

      const addPhotoSection = (label: string, list: TaskPhoto[], buffers: (Buffer | null)[]) => {
        doc.fontSize(11).text(label, { underline: true });
        doc.moveDown(0.5);
        for (let i = 0; i < list.length; i++) {
          const buf = buffers[i];
          if (buf) {
            if (doc.y > 650) doc.addPage();
            doc.image(buf, 50, doc.y + 5, { width: 200, height: 150 });
            doc.moveDown(10);
          } else {
            doc.text(`Foto ${i + 1}: ${list[i].url} (imagem não disponível)`);
            doc.moveDown(0.5);
          }
        }
        doc.moveDown();
      };

      if (beforePhotos.length > 0) addPhotoSection('Fotos ANTES', beforePhotos, beforeBuffers);
      if (afterPhotos.length > 0) addPhotoSection('Fotos DEPOIS', afterPhotos, afterBuffers);

      doc.fontSize(9).text(`Documento gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
      doc.end();
    });
  }

  /**
   * PDF consolidado do dia: todas as tarefas com fotos e evidências.
   */
  async generateDailyPdf(date: Date): Promise<Buffer> {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const tasks = await this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.area', 'a')
      .leftJoinAndSelect('t.employee', 'e')
      .where('t.scheduled_date >= :from', { from: d })
      .andWhere('t.scheduled_date < :to', { to: nextDay })
      .orderBy('t.scheduled_time', 'ASC')
      .addOrderBy('t.created_at', 'ASC')
      .getMany();

    const taskIds = tasks.map((t) => t.id);
    const allPhotos = taskIds.length > 0
      ? await this.photoRepo.find({
          where: { taskId: In(taskIds) },
          order: { taskId: 'ASC', type: 'ASC', createdAt: 'ASC' },
        })
      : [];

    const photosByTask = allPhotos.reduce(
      (acc, p) => {
        if (!acc[p.taskId]) acc[p.taskId] = [];
        acc[p.taskId].push(p);
        return acc;
      },
      {} as Record<string, typeof allPhotos>,
    );

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      if (existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, 50, 50, { width: 80 });
        doc.moveDown(4);
      }
      doc.fontSize(18).text('Relatório Consolidado do Dia - SIGEO', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Data: ${d.toLocaleDateString('pt-BR')}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(10);
      doc.text(`Total de tarefas: ${tasks.length}`);
      doc.moveDown();

      for (const task of tasks) {
        if (doc.y > 650) doc.addPage();
        doc.fontSize(11).text(`Tarefa: ${task.title ?? task.area?.name ?? task.id}`, { underline: true });
        doc.text(`Área: ${task.area?.name ?? '-'} | Funcionário: ${task.employee?.name ?? '-'}`);
        doc.text(`Status: ${task.status}`);
        if (task.startedAt) doc.text(`Início: ${task.startedAt.toLocaleString('pt-BR')}`);
        if (task.completedAt) doc.text(`Conclusão: ${task.completedAt.toLocaleString('pt-BR')}`);
        if (task.checkinLat != null && task.checkinLng != null) {
          doc.text(`GPS: ${task.checkinLat.toFixed(6)}, ${task.checkinLng.toFixed(6)}`);
        }
        const photos = photosByTask[task.id] ?? [];
        const before = photos.filter((p) => p.type === 'BEFORE').length;
        const after = photos.filter((p) => p.type === 'AFTER').length;
        doc.text(`Fotos: ${before} antes / ${after} depois`);
        doc.moveDown(1);
      }

      doc.fontSize(9).text(`Documento gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
      doc.end();
    });
  }
}
