import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Location } from '../../entities/location.entity';
import { locationSchema, locationUpdateSchema } from '@sigeo/shared';
import type { LocationInput, LocationUpdateInput } from '@sigeo/shared';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly repo: Repository<Location>,
  ) {}

  async create(dto: LocationInput): Promise<Location> {
    const data = locationSchema.parse(dto);
    const e = this.repo.create({ id: uuid(), ...data });
    return this.repo.save(e);
  }

  async findAll(page = 1, limit = 50): Promise<{ data: Location[]; total: number; totalPages: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, totalPages };
  }

  async findOne(id: string): Promise<Location> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Local não encontrado');
    return e;
  }

  async update(id: string, dto: LocationUpdateInput): Promise<Location> {
    const data = locationUpdateSchema.parse(dto);
    await this.findOne(id);
    await this.repo.update(id, data as Partial<Location>);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
