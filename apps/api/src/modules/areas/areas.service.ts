import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Area } from '../../entities/area.entity';
import { Location } from '../../entities/location.entity';
import { Task } from '../../entities/task.entity';
import { areaSchema, areaUpdateSchema } from '@sigeo/shared';
import type { AreaInput, AreaUpdateInput } from '@sigeo/shared';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private readonly repo: Repository<Area>,
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  private async validateLocationExists(locationId: string): Promise<void> {
    const loc = await this.locationRepo.findOne({ where: { id: locationId } });
    if (!loc) throw new BadRequestException('Local não encontrado');
  }

  async create(dto: AreaInput): Promise<Area> {
    const data = areaSchema.parse(dto);
    await this.validateLocationExists(data.locationId);
    const e = this.repo.create({ id: uuid(), ...data });
    return this.repo.save(e);
  }

  async findAll(page = 1, limit = 50): Promise<{ data: Area[]; total: number; totalPages: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, totalPages };
  }

  async findByLocation(locationId: string): Promise<Area[]> {
    return this.repo.find({ where: { locationId }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Area> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Área não encontrada');
    return e;
  }

  async update(id: string, dto: AreaUpdateInput): Promise<Area> {
    const data = areaUpdateSchema.parse(dto);
    await this.findOne(id);
    await this.repo.update(id, data as Partial<Area>);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  /** Áreas que não tiveram nenhuma tarefa no período (scheduled_date entre from e to). */
  async findWithoutActivity(from: Date, to: Date): Promise<Area[]> {
    const tasksInPeriod = await this.taskRepo
      .createQueryBuilder('t')
      .select('DISTINCT t.area_id', 'areaId')
      .where('t.scheduled_date >= :from', { from })
      .andWhere('t.scheduled_date <= :to', { to })
      .getRawMany<{ areaId: string }>();
    const idsWithActivity = new Set(tasksInPeriod.map((r) => r.areaId).filter(Boolean));
    const allAreas = await this.repo.find({ order: { name: 'ASC' } });
    return allAreas.filter((a) => !idsWithActivity.has(a.id));
  }
}
