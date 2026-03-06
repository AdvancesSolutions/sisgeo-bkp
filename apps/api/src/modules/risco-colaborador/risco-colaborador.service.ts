import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuid } from 'uuid';
import { RiscoColaborador } from '../../entities/risco-colaborador.entity';
import { Employee } from '../../entities/employee.entity';
import { Task } from '../../entities/task.entity';
import { TimeClock } from '../../entities/time-clock.entity';
import { Evidencia } from '../../entities/evidencia.entity';
import { AiCheckResult } from '../../entities/ai-check-result.entity';
import { OcorrenciaEmergencial } from '../../entities/ocorrencia-emergencial.entity';
import { TaskPhoto } from '../../entities/task-photo.entity';
import { Location } from '../../entities/location.entity';

const SLA_MINUTES = 15;
const DAYS_WINDOW = 15;
const DELAY_INCREASE_THRESHOLD = 0.2; // 20%
const OVERTIME_HOURS_PER_WEEK = 10;
const STANDARD_HOURS_PER_DAY = 8;

export interface RiscoColaboradorRow {
  id: string;
  employeeId: string;
  employeeName: string;
  score: number;
  nivel: string;
  motivos: string[];
  acoesSugeridas: string[];
  detalhes: Record<string, unknown>;
}

@Injectable()
export class RiscoColaboradorService {
  constructor(
    @InjectRepository(RiscoColaborador)
    private readonly repo: Repository<RiscoColaborador>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TimeClock)
    private readonly timeClockRepo: Repository<TimeClock>,
    @InjectRepository(Evidencia)
    private readonly evidenciaRepo: Repository<Evidencia>,
    @InjectRepository(AiCheckResult)
    private readonly aiCheckRepo: Repository<AiCheckResult>,
    @InjectRepository(OcorrenciaEmergencial)
    private readonly ocorrenciaRepo: Repository<OcorrenciaEmergencial>,
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
  ) {}

  /** Worker: executa toda madrugada (3h) */
  @Cron('0 3 * * *')
  async processar(): Promise<number> {
    const refDate = new Date();
    refDate.setHours(0, 0, 0, 0);
    const processed = await this.calcularEPersistir(refDate);
    return processed;
  }

  async calcularEPersistir(
    referenceDate: Date,
    filters?: { organizationId?: string },
  ): Promise<number> {
    const employees = await this.employeeRepo.find({
      where: { status: 'ACTIVE' },
      relations: [],
    });

    const locations = await this.locationRepo.find();
    const locByUnit = new Map(locations.map((l) => [l.id, l]));

    let count = 0;
    for (const emp of employees) {
      const loc = locByUnit.get(emp.unitId);
      const orgId = loc?.organizationId ?? null;
      if (filters?.organizationId && orgId !== filters.organizationId) continue;

      const result = await this.calcularScore(emp.id, referenceDate);
      const existing = await this.repo.findOne({
        where: { employeeId: emp.id, referenceDate },
      });

      const entity = existing ?? this.repo.create({
        id: uuid(),
        employeeId: emp.id,
        organizationId: orgId,
        referenceDate,
      });
      entity.score = result.score;
      entity.nivel = result.nivel;
      entity.motivos = result.motivos;
      entity.acoesSugeridas = result.acoesSugeridas;
      entity.detalhes = result.detalhes;
      await this.repo.save(entity);
      count++;
    }
    return count;
  }

  private async calcularScore(
    employeeId: string,
    refDate: Date,
  ): Promise<{
    score: number;
    nivel: string;
    motivos: string[];
    acoesSugeridas: string[];
    detalhes: Record<string, unknown>;
  }> {
    const motivos: string[] = [];
    const acoesSugeridas: string[] = [];
    const detalhes: Record<string, unknown> = {};
    let score = 0;

    const refEnd = new Date(refDate);
    refEnd.setHours(23, 59, 59, 999);
    const last15 = new Date(refDate);
    last15.setDate(last15.getDate() - DAYS_WINDOW);
    last15.setHours(0, 0, 0, 0);
    const prev15 = new Date(last15);
    prev15.setDate(prev15.getDate() - DAYS_WINDOW);

    // 1. Atrasos recorrentes (peso 25)
    const last15Prev = new Date(last15);
    last15Prev.setDate(last15Prev.getDate() - 1);
    const atrasos = await this.contarAtrasos(employeeId, last15, refDate);
    const atrasosPrev = await this.contarAtrasos(employeeId, prev15, last15Prev);
    const aumentoAtrasos = atrasosPrev > 0
      ? (atrasos - atrasosPrev) / atrasosPrev
      : atrasos > 0 ? 1 : 0;
    if (aumentoAtrasos >= DELAY_INCREASE_THRESHOLD && atrasos > 0) {
      motivos.push('Sinal de desmotivação por aumento de atrasos no check-in');
      acoesSugeridas.push('Agendar entrevista de retenção');
      score += 25;
      detalhes.atrasosUltimos15Dias = atrasos;
      detalhes.atrasosPeriodoAnterior = atrasosPrev;
      detalhes.aumentoPercentual = Math.round(aumentoAtrasos * 100);
    }

    // 2. Queda de qualidade (peso 25)
    const qualidade = await this.avaliarQualidade(employeeId, last15, refEnd);
    if (qualidade.queda) {
      motivos.push('Sinal de desmotivação por queda na produtividade/qualidade');
      acoesSugeridas.push('Agendar entrevista de retenção');
      score += 25;
      detalhes.reprovacoesIA = qualidade.reprovacoes;
      detalhes.anomalias = qualidade.anomalias;
    }

    // 3. Micro-absenteeism (peso 25)
    const microAbs = await this.contarMicroAbsenteismo(employeeId, last15, refEnd);
    if (microAbs > 0) {
      motivos.push('Sinal de desmotivação por aumento de ocorrências/ausências');
      acoesSugeridas.push('Verificar problemas pessoais');
      score += Math.min(25, microAbs * 8);
      detalhes.ocorrenciasMicroAbsenteismo = microAbs;
    }

    // 4. Sobrecarga (peso 25)
    const horasExtras = await this.calcularHorasExtras(employeeId, refDate);
    if (horasExtras >= OVERTIME_HOURS_PER_WEEK) {
      motivos.push('Sinal de cansaço por excesso de jornada');
      acoesSugeridas.push('Sugerir troca de posto ou escala');
      score += 25;
      detalhes.horasExtrasSemana = Math.round(horasExtras * 10) / 10;
    }

    const nivel = score >= 50 ? 'ALTO' : score >= 25 ? 'MEDIO' : 'BAIXO';

    return {
      score: Math.min(100, score),
      nivel,
      motivos,
      acoesSugeridas: [...new Set(acoesSugeridas)],
      detalhes,
    };
  }

  private async contarAtrasos(
    employeeId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const tasks = await this.taskRepo.find({
      where: {
        employeeId,
        scheduledDate: Between(from, to),
        status: ['DONE', 'IN_REVIEW', 'IN_PROGRESS'] as unknown as string,
      },
    });

    let count = 0;
    for (const t of tasks) {
      if (!t.scheduledTime || !t.startedAt || !/^\d{1,2}:\d{2}$/.test(t.scheduledTime)) continue;
      const scheduledDate = new Date(t.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      const [h, m] = t.scheduledTime.split(':').map(Number);
      const scheduledAt = new Date(scheduledDate);
      scheduledAt.setHours(h, m, 0, 0);
      const slaDeadline = new Date(scheduledAt.getTime() + SLA_MINUTES * 60 * 1000);
      if (new Date(t.startedAt) > slaDeadline) count++;
    }
    return count;
  }

  private async avaliarQualidade(
    employeeId: string,
    from: Date,
    to: Date,
  ): Promise<{ queda: boolean; reprovacoes: number; anomalias: number }> {
    const tasks = await this.taskRepo.find({
      where: { employeeId, scheduledDate: Between(from, to) },
      select: ['id'],
    });
    const taskIds = tasks.map((t) => t.id);
    if (taskIds.length === 0) return { queda: false, reprovacoes: 0, anomalias: 0 };

    const allPhotos = await this.taskRepo.manager
      .getRepository(TaskPhoto)
      .createQueryBuilder('p')
      .where('p.task_id IN (:...ids)', { ids: taskIds })
      .getMany();

    let reprovacoes = 0;
    let anomalias = 0;
    for (const p of allPhotos) {
      const ev = await this.evidenciaRepo.findOne({ where: { taskPhotoId: p.id } });
      if (ev?.anomaliaDetectada || ev?.limpo === false) anomalias++;
      const ai = await this.aiCheckRepo.findOne({ where: { taskPhotoId: p.id } });
      if (ai?.status === 'REPROVADO') reprovacoes++;
    }

    const queda = reprovacoes >= 2 || anomalias >= 3;
    return { queda, reprovacoes, anomalias };
  }

  private async contarMicroAbsenteismo(
    employeeId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const count = await this.ocorrenciaRepo.count({
      where: {
        employeeId,
        type: In(['INATIVIDADE', 'PROBLEMAS_PESSOAIS', 'ACESSO_NEGADO']),
        createdAt: Between(from, to),
      },
    });
    return count;
  }

  private async calcularHorasExtras(employeeId: string, refDate: Date): Promise<number> {
    const weekStart = new Date(refDate);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const clocks = await this.timeClockRepo.find({
      where: { employeeId, createdAt: Between(weekStart, refDate) },
      order: { createdAt: 'ASC' },
    });

    const byDay = new Map<string, { checkin?: Date; checkout?: Date }>();
    for (const c of clocks) {
      const day = new Date(c.createdAt).toISOString().slice(0, 10);
      const cur = byDay.get(day) ?? {};
      if (c.type === 'CHECKIN' || c.type === 'CHECKOUT') {
        if (c.type === 'CHECKIN') cur.checkin = new Date(c.createdAt);
        else cur.checkout = new Date(c.createdAt);
        byDay.set(day, cur);
      }
    }

    let totalHours = 0;
    for (const [, v] of byDay) {
      if (v.checkin && v.checkout) {
        const h = (v.checkout.getTime() - v.checkin.getTime()) / (1000 * 60 * 60);
        totalHours += h;
      }
    }

    const standardHours = byDay.size * STANDARD_HOURS_PER_DAY;
    const extras = Math.max(0, totalHours - standardHours);
    return extras;
  }

  async listar(
    referenceDate?: Date,
    filters?: { organizationId?: string; locationId?: string; nivel?: string },
  ): Promise<RiscoColaboradorRow[]> {
    const ref = referenceDate ?? new Date();
    ref.setHours(0, 0, 0, 0);

    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.employee', 'e')
      .where('r.reference_date = :ref', { ref })
      .orderBy('r.score', 'DESC');

    if (filters?.organizationId) {
      qb.andWhere('r.organization_id = :orgId', { orgId: filters.organizationId });
    }
    if (filters?.locationId) {
      qb.andWhere('e.unit_id = :locationId', { locationId: filters.locationId });
    }
    if (filters?.nivel) {
      qb.andWhere('r.nivel = :nivel', { nivel: filters.nivel });
    }

    const rows = await qb.getMany();
    return rows.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee?.name ?? 'Desconhecido',
      score: r.score,
      nivel: r.nivel,
      motivos: r.motivos ?? [],
      acoesSugeridas: r.acoesSugeridas ?? [],
      detalhes: r.detalhes ?? {},
    }));
  }

  async getRoiEconomia(filters?: {
    organizationId?: string;
    locationId?: string;
  }): Promise<{
    turnoverEvitado: number;
    custoMedioContratacao: number;
    colaboradoresEmRisco: number;
    economiaEstimada: number;
  }> {
    const ref = new Date();
    ref.setHours(0, 0, 0, 0);

    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoin('r.employee', 'e')
      .where('r.reference_date = :ref', { ref })
      .andWhere('r.nivel IN (:...niveis)', { niveis: ['MEDIO', 'ALTO'] });
    if (filters?.organizationId) {
      qb.andWhere('r.organization_id = :orgId', { orgId: filters.organizationId });
    }
    if (filters?.locationId) {
      qb.andWhere('e.unit_id = :locationId', { locationId: filters.locationId });
    }

    const emRisco = await qb.getCount();
    const CUSTO_MEDIO_CONTRATACAO = 5000; // R$ 5.000 por desligamento
    const TAXA_CONVERSAO_RETENCAO = 0.3; // 30% dos alertados seriam desligados sem ação
    const turnoverEvitado = Math.round(emRisco * TAXA_CONVERSAO_RETENCAO);
    const economiaEstimada = turnoverEvitado * CUSTO_MEDIO_CONTRATACAO;

    return {
      turnoverEvitado,
      custoMedioContratacao: CUSTO_MEDIO_CONTRATACAO,
      colaboradoresEmRisco: emRisco,
      economiaEstimada,
    };
  }
}
