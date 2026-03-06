import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Area } from '../../entities/area.entity';
import { Task } from '../../entities/task.entity';
import { Incident } from '../../entities/incident.entity';
import { ScoreDiario } from '../../entities/score-diario.entity';

/** Pesos do FindMe Score: Pontualidade 40%, Conformidade 40%, Ocorrências 20% */
const WEIGHT_PONTUALIDADE = 0.4;
const WEIGHT_CONFORMIDADE = 0.4;
const WEIGHT_OCORRENCIAS = 0.2;

/** Penalidade por ocorrência aberta (reduz score_ocorrencias) */
const PENALTY_PER_INCIDENT = 15;

export interface ScoreEvolutionPoint {
  date: string;
  score: number;
  pontualidade: number;
  conformidade: number;
  ocorrencias: number;
}

export interface RankingRow {
  id: string;
  name: string;
  type: 'area' | 'location' | 'organization';
  score: number;
  eficiencia: number;
  conformidade: number;
  pontualidade: number;
  ocorrenciasAbertas: number;
}

@Injectable()
export class FindMeScoreService {
  constructor(
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
    @InjectRepository(ScoreDiario)
    private readonly scoreRepo: Repository<ScoreDiario>,
  ) {}

  /**
   * Calcula e persiste o FindMe Score para todas as áreas em uma data.
   * Algoritmo: 40% Pontualidade + 40% Conformidade + 20% Ocorrências
   */
  async calculateAndPersistForDate(
    referenceDate: Date,
    filters?: { organizationId?: string; locationId?: string },
  ): Promise<ScoreDiario[]> {
    const d = new Date(referenceDate);
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const qb = this.areaRepo.createQueryBuilder('a').innerJoinAndSelect('a.location', 'loc');
    if (filters?.organizationId) qb.andWhere('a.organization_id = :orgId', { orgId: filters.organizationId });
    if (filters?.locationId) qb.andWhere('a.location_id = :locId', { locId: filters.locationId });
    const areas = await qb.getMany();

    const results: ScoreDiario[] = [];
    for (const area of areas) {
      const score = await this.calculateForArea(area, d, nextDay);
      const existing = await this.scoreRepo.findOne({
        where: { referenceDate: d, areaId: area.id },
      });
      const entity = existing ?? this.scoreRepo.create({
        id: uuid(),
        referenceDate: d,
        areaId: area.id,
        locationId: area.locationId,
        organizationId: area.organizationId,
      });
      entity.scoreTotal = score.total;
      entity.scorePontualidade = score.pontualidade;
      entity.scoreConformidade = score.conformidade;
      entity.scoreOcorrencias = score.ocorrencias;
      entity.tasksTotal = score.tasksTotal;
      entity.tasksDone = score.tasksDone;
      entity.tasksOnTime = score.tasksOnTime;
      entity.ocorrenciasAbertas = score.ocorrenciasAbertas;
      await this.scoreRepo.save(entity);
      results.push(entity);
    }
    return results;
  }

  private async calculateForArea(
    area: Area,
    from: Date,
    to: Date,
  ): Promise<{
    total: number;
    pontualidade: number;
    conformidade: number;
    ocorrencias: number;
    tasksTotal: number;
    tasksDone: number;
    tasksOnTime: number;
    ocorrenciasAbertas: number;
  }> {
    const toExclusive = new Date(to.getTime() - 1);
    const tasks = await this.taskRepo.find({
      where: {
        areaId: area.id,
        scheduledDate: Between(from, toExclusive),
      },
      relations: ['area'],
    });

    const tasksTotal = tasks.length;
    const doneCount = tasks.filter((t) => t.status === 'DONE').length;
    const rejectedCount = tasks.filter((t) => t.status === 'REJECTED').length;
    const totalValidated = doneCount + rejectedCount;
    const conformidade = totalValidated > 0 ? Math.round((doneCount / totalValidated) * 100) : 100;

    const tasksWithScheduledTime = tasks.filter(
      (t) => t.scheduledTime && t.startedAt && /^\d{1,2}:\d{2}$/.test(t.scheduledTime),
    );
    let tasksOnTime = 0;
    for (const t of tasksWithScheduledTime) {
      const scheduledDate = new Date(t.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      const [h, m] = (t.scheduledTime ?? '00:00').split(':').map(Number);
      const scheduledAt = new Date(scheduledDate);
      scheduledAt.setHours(h, m, 0, 0);
      const slaDeadline = new Date(scheduledAt.getTime() + 15 * 60 * 1000);
      if (t.startedAt && new Date(t.startedAt) <= slaDeadline) tasksOnTime++;
    }
    const pontualidade =
      tasksWithScheduledTime.length > 0
        ? Math.round((tasksOnTime / tasksWithScheduledTime.length) * 100)
        : 100;

    const ocorrenciasCount = area.organizationId
      ? await this.incidentRepo.count({
          where: [
            { status: 'ABERTO', organizationId: area.organizationId },
            { status: 'EM_ANALISE', organizationId: area.organizationId },
          ],
        })
      : 0;
    const penalty = Math.min(100, ocorrenciasCount * PENALTY_PER_INCIDENT);
    const scoreOcorrencias = Math.max(0, 100 - penalty);

    const total = Math.round(
      WEIGHT_PONTUALIDADE * pontualidade +
        WEIGHT_CONFORMIDADE * conformidade +
        WEIGHT_OCORRENCIAS * scoreOcorrencias,
    );

    return {
      total: Math.min(100, Math.max(0, total)),
      pontualidade,
      conformidade,
      ocorrencias: scoreOcorrencias,
      tasksTotal,
      tasksDone: doneCount,
      tasksOnTime,
      ocorrenciasAbertas: ocorrenciasCount,
    };
  }

  /**
   * Evolução de performance por período (dia/semana/mês)
   */
  async getPerformanceEvolution(
    from: Date,
    to: Date,
    granularity: 'day' | 'week' | 'month',
    filters?: { organizationId?: string; locationId?: string; areaId?: string },
  ): Promise<ScoreEvolutionPoint[]> {
    const qb = this.scoreRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.area', 'a')
      .where('s.reference_date >= :from', { from })
      .andWhere('s.reference_date <= :to', { to })
      .orderBy('s.reference_date', 'ASC');

    if (filters?.organizationId) qb.andWhere('s.organization_id = :orgId', { orgId: filters.organizationId });
    if (filters?.locationId) qb.andWhere('s.location_id = :locId', { locId: filters.locationId });
    if (filters?.areaId) qb.andWhere('s.area_id = :areaId', { areaId: filters.areaId });

    const rows = await qb.getMany();

    const byKey = new Map<string, { total: number; p: number; c: number; o: number; count: number }>();
    for (const r of rows) {
      const d = new Date(r.referenceDate);
      let key: string;
      if (granularity === 'day') key = d.toISOString().slice(0, 10);
      else if (granularity === 'week') key = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
      else key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const cur = byKey.get(key) ?? { total: 0, p: 0, c: 0, o: 0, count: 0 };
      cur.total += r.scoreTotal;
      cur.p += r.scorePontualidade;
      cur.c += r.scoreConformidade;
      cur.o += r.scoreOcorrencias;
      cur.count++;
      byKey.set(key, cur);
    }

    return Array.from(byKey.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        score: Math.round(v.total / v.count),
        pontualidade: Math.round(v.p / v.count),
        conformidade: Math.round(v.c / v.count),
        ocorrencias: Math.round(v.o / v.count),
      }));
  }

  /**
   * Ranking de eficiência por região/unidade/setor
   */
  async getRanking(
    referenceDate: Date,
    groupBy: 'area' | 'location' | 'organization',
    filters?: { organizationId?: string; locationId?: string },
  ): Promise<RankingRow[]> {
    const d = new Date(referenceDate);
    d.setHours(0, 0, 0, 0);

    const qb = this.scoreRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.area', 'a')
      .leftJoinAndSelect('s.location', 'loc')
      .leftJoinAndSelect('s.organization', 'org')
      .where('s.reference_date = :ref', { ref: d })
      .orderBy('s.score_total', 'DESC');

    if (filters?.organizationId) qb.andWhere('s.organization_id = :orgId', { orgId: filters.organizationId });
    if (filters?.locationId) qb.andWhere('s.location_id = :locId', { locId: filters.locationId });

    const rows = await qb.getMany();

    const byGroup = new Map<
      string,
      { name: string; total: number; p: number; c: number; o: number; ocorr: number; count: number }
    >();
    for (const r of rows) {
      let id: string;
      let name: string;
      if (groupBy === 'area') {
        id = r.areaId;
        name = r.area?.name ?? r.areaId;
      } else if (groupBy === 'location') {
        id = r.locationId;
        name = r.location?.name ?? r.locationId;
      } else {
        id = r.organizationId ?? 'global';
        name = r.organization?.name ?? 'Sem organização';
      }

      const cur = byGroup.get(id) ?? { name, total: 0, p: 0, c: 0, o: 0, ocorr: 0, count: 0 };
      cur.total += r.scoreTotal;
      cur.p += r.scorePontualidade;
      cur.c += r.scoreConformidade;
      cur.o += r.scoreOcorrencias;
      cur.ocorr += r.ocorrenciasAbertas;
      cur.count++;
      byGroup.set(id, cur);
    }

    return Array.from(byGroup.entries()).map(([id, v]) => ({
      id,
      name: v.name,
      type: groupBy,
      score: Math.round(v.total / v.count),
      eficiencia: Math.round(v.total / v.count),
      conformidade: Math.round(v.c / v.count),
      pontualidade: Math.round(v.p / v.count),
      ocorrenciasAbertas: v.ocorr,
    }));
  }

  /**
   * Retorna scores calculados em tempo real (sem persistir) para a data atual
   */
  async getScoresRealtime(
    referenceDate: Date,
    filters?: { organizationId?: string; locationId?: string; areaId?: string },
  ): Promise<ScoreEvolutionPoint[]> {
    await this.calculateAndPersistForDate(referenceDate, filters);
    const d = new Date(referenceDate);
    d.setHours(0, 0, 0, 0);
    const points = await this.getPerformanceEvolution(d, d, 'day', filters);
    return points;
  }
}
