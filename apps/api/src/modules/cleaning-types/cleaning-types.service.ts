import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { CleaningType } from '../../entities/cleaning-type.entity';
import { cleaningTypeSchema, cleaningTypeUpdateSchema } from '@sigeo/shared';
import type { CleaningTypeInput, CleaningTypeUpdateInput } from '@sigeo/shared';

@Injectable()
export class CleaningTypesService {
  constructor(
    @InjectRepository(CleaningType)
    private readonly repo: Repository<CleaningType>,
  ) {}

  async create(dto: CleaningTypeInput) {
    const data = cleaningTypeSchema.parse(dto);
    const e = this.repo.create({
      id: uuid(),
      name: data.name,
      description: data.description ?? null,
    });
    return this.repo.save(e);
  }

  async findAll(): Promise<CleaningType[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<CleaningType> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Tipo de limpeza não encontrado');
    return e;
  }

  async update(id: string, dto: CleaningTypeUpdateInput): Promise<CleaningType> {
    const data = cleaningTypeUpdateSchema.parse(dto);
    await this.findOne(id);
    await this.repo.update(id, data as Partial<CleaningType>);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
