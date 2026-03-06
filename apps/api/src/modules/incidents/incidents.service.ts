import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Incident } from '../../entities/incident.entity';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly repo: Repository<Incident>,
  ) {}

  async findAll(filters?: { status?: string }): Promise<Incident[]> {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async countActive(): Promise<number> {
    return this.repo.count({
      where: [{ status: 'ABERTO' }, { status: 'EM_ANALISE' }],
    });
  }

  async create(dto: {
    employeeId: string;
    type: string;
    description: string;
    organizationId?: string | null;
    areaId?: string | null;
  }): Promise<Incident> {
    const e = this.repo.create({
      id: uuid(),
      ...dto,
      status: 'ABERTO',
    });
    return this.repo.save(e);
  }

  async updateStatus(id: string, status: string): Promise<Incident> {
    await this.repo.update(id, { status });
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Ocorrência não encontrada');
    return item;
  }
}
