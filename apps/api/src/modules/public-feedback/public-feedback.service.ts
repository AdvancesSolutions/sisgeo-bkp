import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuid } from 'uuid';
import { PublicFeedback } from '../../entities/public-feedback.entity';
import { Area } from '../../entities/area.entity';
import { Task } from '../../entities/task.entity';
import { TasksService } from '../tasks/tasks.service';

export const ALERT_TYPES = [
  'falta_papel',
  'piso_molhado',
  'sabao_acabou',
  'lixeira_cheia',
  'outro',
] as const;

export interface PublicFeedbackInput {
  areaId: string;
  rating: number;
  alertType?: string | null;
  photoUrl?: string | null;
}

@Injectable()
export class PublicFeedbackService {
  constructor(
    @InjectRepository(PublicFeedback)
    private readonly repo: Repository<PublicFeedback>,
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly tasksService: TasksService,
  ) {}

  /** Área pública (sem auth) - info mínima para o formulário */
  async getAreaPublic(areaId: string): Promise<{ id: string; name: string }> {
    const area = await this.areaRepo.findOne({ where: { id: areaId } });
    if (!area) throw new NotFoundException('Área não encontrada');
    return { id: area.id, name: area.name };
  }

  /** Recebe feedback público e cria tarefa se necessário */
  async create(dto: PublicFeedbackInput): Promise<{
    id: string;
    rating: number;
    taskCreated: boolean;
    taskId?: string;
    message: string;
  }> {
    const area = await this.areaRepo.findOne({ where: { id: dto.areaId } });
    if (!area) throw new BadRequestException('Área não encontrada');

    const rating = Math.min(5, Math.max(1, Math.round(dto.rating)));
    const alertType = dto.alertType && ALERT_TYPES.includes(dto.alertType as (typeof ALERT_TYPES)[number])
      ? dto.alertType
      : null;

    const feedback = this.repo.create({
      id: uuid(),
      areaId: dto.areaId,
      rating,
      alertType,
      photoUrl: dto.photoUrl ?? null,
      organizationId: area.organizationId,
    });
    await this.repo.save(feedback);

    const needsTask = rating < 3 || !!alertType;
    let taskId: string | undefined;

    if (needsTask) {
      const task = await this.createIntercorrentTask(feedback, area, alertType);
      if (task) {
        taskId = task.id;
        await this.repo.update(feedback.id, { taskId: task.id });
      }
    }

    const message = needsTask
      ? 'Obrigado pelo feedback. Nossa equipe foi acionada e irá resolver em breve.'
      : 'Obrigado pela avaliação!';

    return {
      id: feedback.id,
      rating,
      taskCreated: !!taskId,
      taskId,
      message,
    };
  }

  private async createIntercorrentTask(
    feedback: PublicFeedback,
    area: Area,
    alertType: string | null,
  ): Promise<Task | null> {
    const isReposicao = alertType && ['falta_papel', 'sabao_acabou'].includes(alertType);
    const title = isReposicao
      ? 'Reposição Urgente (feedback usuário)'
      : 'Limpeza Intercorrente (feedback usuário)';
    const descParts = [
      `Avaliação: ${feedback.rating} estrelas`,
      alertType ? `Alerta: ${alertType}` : null,
      feedback.photoUrl ? 'Foto anexada pelo usuário.' : null,
    ].filter(Boolean);
    const description = descParts.join('. ');

    try {
      const task = await this.tasksService.create({
        areaId: area.id,
        scheduledDate: new Date(),
        status: 'PENDING',
        title,
        description,
      });
      return task;
    } catch {
      return null;
    }
  }

  /** Dashboard: métricas de satisfação e SLA (autenticado) */
  async getStats(filters?: { areaId?: string; since?: Date }): Promise<{
    total: number;
    avgRating: number;
    byArea: { areaId: string; areaName: string; total: number; avgRating: number }[];
    alertsResolved: number;
    alertsTotal: number;
    avgResolutionMinutes: number;
  }> {
    const qb = this.repo.createQueryBuilder('f').leftJoinAndSelect('f.area', 'a');
    if (filters?.areaId) qb.andWhere('f.area_id = :areaId', { areaId: filters.areaId });
    if (filters?.since) qb.andWhere('f.created_at >= :since', { since: filters.since });
    const allFiltered = await qb.getMany();

    const total = allFiltered.length;
    const avgRating = total > 0 ? allFiltered.reduce((s, f) => s + f.rating, 0) / total : 0;
    const byAreaMap = new Map<string, { total: number; sum: number; name: string }>();
    for (const f of allFiltered) {
      const key = f.areaId;
      const name = f.area?.name ?? 'Área';
      if (!byAreaMap.has(key)) byAreaMap.set(key, { total: 0, sum: 0, name });
      const v = byAreaMap.get(key)!;
      v.total++;
      v.sum += f.rating;
    }
    const byArea = Array.from(byAreaMap.entries()).map(([areaId, v]) => ({
      areaId,
      areaName: v.name,
      total: v.total,
      avgRating: v.total > 0 ? v.sum / v.total : 0,
    }));

    const withTask = allFiltered.filter((f) => f.taskId);
    const alertsTotal = withTask.length;
    const resolved = allFiltered.filter((f) => f.resolvedAt != null && f.taskId);
    const alertsResolved = resolved.length;
    let avgResolutionMinutes = 0;
    if (resolved.length > 0) {
      const sum = resolved.reduce((s, f) => {
        const created = new Date(f.createdAt).getTime();
        const resolvedAt = new Date(f.resolvedAt!).getTime();
        return s + (resolvedAt - created) / 60000;
      }, 0);
      avgResolutionMinutes = sum / resolved.length;
    }

    return {
      total,
      avgRating,
      byArea,
      alertsResolved,
      alertsTotal,
      avgResolutionMinutes: Math.round(avgResolutionMinutes * 10) / 10,
    };
  }

  /** Cron: marca resolved_at quando a tarefa vinculada for DONE */
  @Cron(CronExpression.EVERY_MINUTE)
  async syncResolvedAt(): Promise<void> {
    const feedbacks = await this.repo.find({
      where: { taskId: Not(IsNull()), resolvedAt: IsNull() },
      select: ['id', 'taskId'],
    });

    for (const f of feedbacks) {
      if (!f.taskId) continue;
      const task = await this.taskRepo.findOne({ where: { id: f.taskId } });
      if (task?.status === 'DONE') {
        await this.repo.update(f.id, { resolvedAt: new Date() });
      }
    }
  }
}
