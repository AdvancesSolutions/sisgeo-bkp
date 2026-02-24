import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Ativo } from '../../entities/ativo.entity';
import { AtivoManutencao } from '../../entities/ativo-manutencao.entity';
import { Task } from '../../entities/task.entity';
import { Area } from '../../entities/area.entity';

export interface AtivoInput {
  nome: string;
  modelo?: string | null;
  dataCompra?: Date | null;
  numeroSerie?: string | null;
  limiteManutencaoHoras?: number | null;
  locationId?: string | null;
  organizationId?: string | null;
}

@Injectable()
export class AtivosService {
  constructor(
    @InjectRepository(Ativo)
    private readonly repo: Repository<Ativo>,
    @InjectRepository(AtivoManutencao)
    private readonly manutencaoRepo: Repository<AtivoManutencao>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
  ) {}

  async create(dto: AtivoInput): Promise<Ativo> {
    const e = this.repo.create({
      id: uuid(),
      nome: dto.nome,
      modelo: dto.modelo ?? null,
      dataCompra: dto.dataCompra ?? null,
      numeroSerie: dto.numeroSerie ?? null,
      limiteManutencaoHoras: dto.limiteManutencaoHoras ?? null,
      locationId: dto.locationId ?? null,
      organizationId: dto.organizationId ?? null,
      qrCode: `ATIVO-${uuid().slice(0, 8).toUpperCase()}`,
    });
    return this.repo.save(e);
  }

  async findAll(
    page = 1,
    limit = 50,
    filters?: { status?: string; locationId?: string },
  ): Promise<{ data: Ativo[]; total: number; totalPages: number }> {
    const qb = this.repo.createQueryBuilder('a').leftJoinAndSelect('a.location', 'loc');
    if (filters?.status) qb.andWhere('a.status = :status', { status: filters.status });
    if (filters?.locationId) qb.andWhere('a.location_id = :locId', { locId: filters.locationId });
    qb.orderBy('a.nome', 'ASC');
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, totalPages };
  }

  async findOne(id: string): Promise<Ativo> {
    const e = await this.repo.findOne({ where: { id }, relations: ['location'] });
    if (!e) throw new NotFoundException('Ativo não encontrado');
    return e;
  }

  async findByQrCode(qrCode: string): Promise<Ativo | null> {
    return this.repo.findOne({ where: { qrCode }, relations: ['location'] });
  }

  async update(id: string, dto: Partial<AtivoInput>): Promise<Ativo> {
    await this.findOne(id);
    await this.repo.update(id, dto as Partial<Ativo>);
    return this.findOne(id);
  }

  async darBaixaManutencao(id: string, observacoes?: string): Promise<Ativo> {
    const ativo = await this.findOne(id);
    if (ativo.status !== 'MANUTENCAO') {
      throw new BadRequestException('Apenas ativos em MANUTENCAO podem receber baixa');
    }
    const manutencaoAberta = await this.manutencaoRepo.findOne({
      where: { ativoId: id, dataFim: null as unknown as Date },
      order: { dataInicio: 'DESC' },
    });
    if (manutencaoAberta) {
      await this.manutencaoRepo.update(manutencaoAberta.id, {
        dataFim: new Date(),
        observacoes: observacoes ?? manutencaoAberta.observacoes,
      });
    }
    await this.repo.update(id, { status: 'OPERACIONAL' });
    return this.findOne(id);
  }

  async getAlertasPreventivos(): Promise<Ativo[]> {
    const ativos = await this.repo.find({
      where: { status: 'OPERACIONAL' },
      relations: ['location'],
    });
    return ativos.filter((a) => {
      const limite = a.limiteManutencaoHoras ?? 0;
      if (limite <= 0) return false;
      const pct = (a.horasUsoTotal / limite) * 100;
      return pct >= 90;
    });
  }

  /**
   * Cria tarefa MANUTENÇÃO TÉCNICA e bloqueia ativo quando limite é atingido.
   */
  async verificarLimiteEAutoTask(ativo: Ativo): Promise<{ tarefaCriada?: Task }> {
    const limite = ativo.limiteManutencaoHoras ?? 0;
    if (limite <= 0 || ativo.horasUsoTotal < limite) return {};

    await this.repo.update(ativo.id, { status: 'MANUTENCAO' });

    const manutencao = this.manutencaoRepo.create({
      id: uuid(),
      ativoId: ativo.id,
      tipo: 'TECNICA',
      dataInicio: new Date(),
      observacoes: `Auto-gerado: limite de ${limite}h atingido (${ativo.horasUsoTotal.toFixed(1)}h de uso).`,
      organizationId: ativo.organizationId,
    });
    await this.manutencaoRepo.save(manutencao);

    const areas = await this.areaRepo.find({
      where: ativo.locationId ? { locationId: ativo.locationId } : {},
      take: 1,
    });
    const areaId = areas[0]?.id;
    if (areaId) {
      const task = this.taskRepo.create({
        id: uuid(),
        areaId,
        scheduledDate: new Date(),
        status: 'PENDING',
        title: `Manutenção Técnica: ${ativo.nome}`,
        description: `Equipamento atingiu limite de ${limite}h. Realizar manutenção preventiva.`,
        organizationId: ativo.organizationId,
      });
      await this.taskRepo.save(task);
      return { tarefaCriada: task };
    }
    return {};
  }
}
