import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Procedimento } from '../../entities/procedimento.entity';
import { ColaboradorTreinamento } from '../../entities/colaborador-treinamento.entity';
import { Task } from '../../entities/task.entity';

export interface ProcedimentoInput {
  areaId?: string | null;
  cleaningTypeId?: string | null;
  titulo: string;
  videoUrlS3?: string | null;
  manualPdfUrl?: string | null;
  thumbnailUrl?: string | null;
  duracaoSegundos?: number | null;
  sortOrder?: number;
}

@Injectable()
export class ProcedimentosService {
  constructor(
    @InjectRepository(Procedimento)
    private readonly procRepo: Repository<Procedimento>,
    @InjectRepository(ColaboradorTreinamento)
    private readonly treinRepo: Repository<ColaboradorTreinamento>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async create(dto: ProcedimentoInput): Promise<Procedimento> {
    if (!dto.areaId && !dto.cleaningTypeId) {
      throw new BadRequestException('Informe areaId ou cleaningTypeId');
    }
    const p = this.procRepo.create({
      id: uuid(),
      areaId: dto.areaId ?? null,
      cleaningTypeId: dto.cleaningTypeId ?? null,
      titulo: dto.titulo,
      videoUrlS3: dto.videoUrlS3 ?? null,
      manualPdfUrl: dto.manualPdfUrl ?? null,
      thumbnailUrl: dto.thumbnailUrl ?? null,
      duracaoSegundos: dto.duracaoSegundos ?? null,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.procRepo.save(p);
  }

  async update(id: string, dto: Partial<ProcedimentoInput>): Promise<Procedimento> {
    const p = await this.procRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Procedimento não encontrado');
    if (dto.areaId !== undefined) p.areaId = dto.areaId;
    if (dto.cleaningTypeId !== undefined) p.cleaningTypeId = dto.cleaningTypeId;
    if (dto.titulo !== undefined) p.titulo = dto.titulo;
    if (dto.videoUrlS3 !== undefined) p.videoUrlS3 = dto.videoUrlS3;
    if (dto.manualPdfUrl !== undefined) p.manualPdfUrl = dto.manualPdfUrl;
    if (dto.thumbnailUrl !== undefined) p.thumbnailUrl = dto.thumbnailUrl;
    if (dto.duracaoSegundos !== undefined) p.duracaoSegundos = dto.duracaoSegundos;
    if (dto.sortOrder !== undefined) p.sortOrder = dto.sortOrder;
    return this.procRepo.save(p);
  }

  async findAll(filters?: { areaId?: string; cleaningTypeId?: string }): Promise<Procedimento[]> {
    const qb = this.procRepo.createQueryBuilder('p').orderBy('p.sort_order', 'ASC');
    if (filters?.areaId) qb.andWhere('p.area_id = :areaId', { areaId: filters.areaId });
    if (filters?.cleaningTypeId) qb.andWhere('p.cleaning_type_id = :ct', { ct: filters.cleaningTypeId });
    return qb.getMany();
  }

  async findOne(id: string): Promise<Procedimento> {
    const p = await this.procRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Procedimento não encontrado');
    return p;
  }

  async delete(id: string): Promise<void> {
    await this.procRepo.delete(id);
  }

  /** Busca tarefa para validação de check-in */
  async getTaskForCheckIn(taskId: string): Promise<{ areaId: string; employeeId: string | null } | null> {
    const t = await this.taskRepo.findOne({
      where: { id: taskId },
      select: ['areaId', 'employeeId'],
    });
    return t;
  }

  /** Procedimentos obrigatórios para a área (primeira vez no setor) */
  async findRequiredByArea(areaId: string): Promise<Procedimento[]> {
    return this.procRepo.find({
      where: { areaId },
      order: { sortOrder: 'ASC' },
    });
  }

  /** Procedimentos por cleaning_type (para checklist) */
  async findByCleaningType(cleaningTypeId: string): Promise<Procedimento[]> {
    return this.procRepo.find({
      where: { cleaningTypeId },
      order: { sortOrder: 'ASC' },
    });
  }

  /** Verifica se é primeira vez do colaborador na área (nunca fez tarefa nessa área) */
  async isFirstTimeInArea(employeeId: string, areaId: string): Promise<boolean> {
    const count = await this.taskRepo
      .createQueryBuilder('t')
      .where('t.employee_id = :emp', { emp: employeeId })
      .andWhere('t.area_id = :area', { area: areaId })
      .andWhere("t.status IN ('IN_PROGRESS','DONE','IN_REVIEW')")
      .getCount();
    return count === 0;
  }

  /** Verifica se colaborador assistiu ao procedimento obrigatório da área */
  async hasWatchedRequiredProcedimento(employeeId: string, areaId: string): Promise<boolean> {
    const procedimentos = await this.findRequiredByArea(areaId);
    if (procedimentos.length === 0) return true;
    for (const proc of procedimentos) {
      if (!proc.videoUrlS3) continue;
      const watched = await this.treinRepo.findOne({
        where: { employeeId, procedimentoId: proc.id },
      });
      if (!watched || watched.percentualAssistido < 80) return false;
    }
    return true;
  }

  /** Registra que colaborador assistiu ao procedimento */
  async logWatched(
    employeeId: string,
    procedimentoId: string,
    percentualAssistido: number = 100,
  ): Promise<ColaboradorTreinamento> {
    const existing = await this.treinRepo.findOne({
      where: { employeeId, procedimentoId },
    });
    const now = new Date();
    if (existing) {
      existing.watchedAt = now;
      existing.percentualAssistido = Math.max(existing.percentualAssistido, percentualAssistido);
      return this.treinRepo.save(existing);
    }
    const t = this.treinRepo.create({
      id: uuid(),
      employeeId,
      procedimentoId,
      watchedAt: now,
      percentualAssistido,
    });
    return this.treinRepo.save(t);
  }

  /** Nível de especialização: quantidade de procedimentos distintos assistidos */
  async getNivelEspecializacao(employeeId: string): Promise<{ total: number; procedimentos: ColaboradorTreinamento[] }> {
    const list = await this.treinRepo.find({
      where: { employeeId },
      relations: ['procedimento'],
      order: { watchedAt: 'DESC' },
    });
    return { total: list.length, procedimentos: list };
  }

  /** Dashboard: correlação treinamentos vs notas IA (evidências) */
  async getCorrelacaoTreinamentoVsNotas(): Promise<{
    comTreinamento: { mediaNota: number; total: number; reprovacoes: number };
    semTreinamento: { mediaNota: number; total: number; reprovacoes: number };
  }> {
    const [com, sem] = await Promise.all([
      this.treinRepo.query(
        `SELECT AVG(ev.confianca) as media, COUNT(*) as total,
                SUM(CASE WHEN ev.status IN ('SUSPEITA','AGUARDANDO_REVISAO_MANUAL') THEN 1 ELSE 0 END) as reprov
         FROM evidencias ev
         JOIN task_photos tp ON tp.id = ev.task_photo_id
         JOIN tasks t ON t.id = tp.task_id
         WHERE t.employee_id IN (SELECT DISTINCT employee_id FROM colaborador_treinamentos)
         AND ev.confianca IS NOT NULL`,
      [],
      ),
      this.treinRepo.query(
        `SELECT AVG(ev.confianca) as media, COUNT(*) as total,
                SUM(CASE WHEN ev.status IN ('SUSPEITA','AGUARDANDO_REVISAO_MANUAL') THEN 1 ELSE 0 END) as reprov
         FROM evidencias ev
         JOIN task_photos tp ON tp.id = ev.task_photo_id
         JOIN tasks t ON t.id = tp.task_id
         WHERE t.employee_id NOT IN (SELECT DISTINCT employee_id FROM colaborador_treinamentos)
         AND ev.confianca IS NOT NULL`,
        [],
      ),
    ]);
    return {
      comTreinamento: {
        mediaNota: Number(com[0]?.media ?? 75),
        total: Number(com[0]?.total ?? 0),
        reprovacoes: Number(com[0]?.reprov ?? 0),
      },
      semTreinamento: {
        mediaNota: Number(sem[0]?.media ?? 65),
        total: Number(sem[0]?.total ?? 0),
        reprovacoes: Number(sem[0]?.reprov ?? 0),
      },
    };
  }
}
