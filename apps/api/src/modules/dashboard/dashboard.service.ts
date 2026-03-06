import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../entities/task.entity';
import { Incident } from '../../entities/incident.entity';
import { Area } from '../../entities/area.entity';
import { FindMeScoreService } from '../findme-score/findme-score.service';

export interface DashboardKpis {
  taxaConformidade: number;
  slaPontualidade: number;
  ocorrenciasAtivas: number;
  coberturaSetores: { limpos: number; pendentes: number; total: number };
}

export interface DashboardTaskRow {
  id: string;
  title: string | null;
  status: string;
  scheduledDate: Date;
  scheduledTime: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  areaId: string;
  areaName: string;
  riskClassification: string | null;
  employeeId: string | null;
  employeeName: string | null;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
    private readonly findMeScore: FindMeScoreService,
  ) {}

  async getKpis(date?: Date): Promise<DashboardKpis> {
    const d = date ?? new Date();
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const tasks = await this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.area', 'a')
      .where('t.scheduled_date >= :from', { from: d })
      .andWhere('t.scheduled_date < :to', { to: nextDay })
      .getMany();

    const totalTasks = tasks.length;
    const doneCount = tasks.filter((t) => t.status === 'DONE').length;
    const rejectedCount = tasks.filter((t) => t.status === 'REJECTED').length;
    const totalValidated = doneCount + rejectedCount;
    const taxaConformidade = totalValidated > 0 ? Math.round((doneCount / totalValidated) * 100) : 100;

    const tasksWithScheduledTime = tasks.filter(
      (t) => t.scheduledTime && t.startedAt && /^\d{1,2}:\d{2}$/.test(t.scheduledTime),
    );
    let slaOnTime = 0;
    for (const t of tasksWithScheduledTime) {
      const scheduledDate = new Date(t.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      const [h, m] = (t.scheduledTime ?? '00:00').split(':').map(Number);
      const scheduledAt = new Date(scheduledDate);
      scheduledAt.setHours(h, m, 0, 0);
      const slaDeadline = new Date(scheduledAt.getTime() + 15 * 60 * 1000);
      if (t.startedAt && new Date(t.startedAt) <= slaDeadline) slaOnTime++;
    }
    const slaPontualidade =
      tasksWithScheduledTime.length > 0
        ? Math.round((slaOnTime / tasksWithScheduledTime.length) * 100)
        : 100;

    const ocorrenciasAtivas = await this.incidentRepo.count({
      where: [{ status: 'ABERTO' }, { status: 'EM_ANALISE' }],
    });

    const areaIds = [...new Set(tasks.map((t) => t.areaId))];
    const areasWithTasksToday = areaIds.length;
    const areasWithDone = new Set(
      tasks.filter((t) => t.status === 'DONE').map((t) => t.areaId),
    ).size;
    const areasPending = areasWithTasksToday - areasWithDone;
    const allAreasCount = await this.areaRepo.count();

    return {
      taxaConformidade,
      slaPontualidade,
      ocorrenciasAtivas,
      coberturaSetores: {
        limpos: areasWithDone,
        pendentes: areasPending,
        total: allAreasCount,
      },
    };
  }

  async getTasksLive(
    date?: Date,
    filters?: { status?: string; areaId?: string; employeeId?: string; riskClassification?: string },
  ): Promise<DashboardTaskRow[]> {
    const d = date ?? new Date();
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const qb = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.area', 'a')
      .leftJoinAndSelect('t.employee', 'e')
      .where('t.scheduled_date >= :from', { from: d })
      .andWhere('t.scheduled_date < :to', { to: nextDay })
      .orderBy("CASE WHEN a.risk_classification = 'crítico' OR a.risk_classification = 'CRITICO' THEN 0 ELSE 1 END")
      .addOrderBy('t.scheduled_time', 'ASC')
      .addOrderBy('t.created_at', 'ASC');

    if (filters?.status) qb.andWhere('t.status = :status', { status: filters.status });
    if (filters?.areaId) qb.andWhere('t.area_id = :areaId', { areaId: filters.areaId });
    if (filters?.employeeId) qb.andWhere('t.employee_id = :employeeId', { employeeId: filters.employeeId });
    if (filters?.riskClassification) {
      qb.andWhere('a.risk_classification = :risk', { risk: filters.riskClassification });
    }

    const tasks = await qb.getMany();

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      scheduledDate: t.scheduledDate,
      scheduledTime: t.scheduledTime,
      startedAt: t.startedAt,
      completedAt: t.completedAt,
      areaId: t.areaId,
      areaName: t.area?.name ?? '-',
      riskClassification: t.area?.riskClassification ?? null,
      employeeId: t.employeeId,
      employeeName: t.employee?.name ?? null,
    }));
  }

  async getPerformanceEvolution(
    from: Date,
    to: Date,
    granularity: 'day' | 'week' | 'month',
    filters?: { organizationId?: string; locationId?: string; areaId?: string },
  ) {
    return this.findMeScore.getPerformanceEvolution(from, to, granularity, filters);
  }

  async getRanking(
    referenceDate: Date,
    groupBy: 'area' | 'location' | 'organization',
    filters?: { organizationId?: string; locationId?: string },
  ) {
    return this.findMeScore.getRanking(referenceDate, groupBy, filters);
  }

  async calculateFindMeScore(date: Date, filters?: { organizationId?: string; locationId?: string }) {
    return this.findMeScore.calculateAndPersistForDate(date, filters);
  }
}
