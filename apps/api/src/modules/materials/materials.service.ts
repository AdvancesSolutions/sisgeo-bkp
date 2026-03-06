import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Material } from '../../entities/material.entity';
import { MaterialComment } from '../../entities/material-comment.entity';
import { materialSchema, materialUpdateSchema, materialCommentSchema } from '@sigeo/shared';
import type { MaterialInput, MaterialUpdateInput, MaterialCommentInput } from '@sigeo/shared';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly repo: Repository<Material>,
    @InjectRepository(MaterialComment)
    private readonly commentRepo: Repository<MaterialComment>,
  ) {}

  async create(dto: MaterialInput): Promise<Material> {
    const data = materialSchema.parse(dto);
    const e = this.repo.create({ id: uuid(), ...data });
    return this.repo.save(e);
  }

  async findAll(page = 1, limit = 50): Promise<{ data: Material[]; total: number; totalPages: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, totalPages };
  }

  async findOne(id: string): Promise<Material> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Material não encontrado');
    return e;
  }

  async update(id: string, dto: MaterialUpdateInput): Promise<Material> {
    const data = materialUpdateSchema.parse(dto);
    await this.findOne(id);
    if (data.stock !== undefined && data.stock < 0) {
      throw new BadRequestException('Estoque não pode ser negativo');
    }
    await this.repo.update(id, data as Partial<Material>);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  async findCommentsByMaterial(
    materialId: string,
  ): Promise<Array<{ id: string; materialId: string; userId: string; body: string; createdAt: Date; userName?: string }>> {
    await this.findOne(materialId);
    const comments = await this.commentRepo.find({
      where: { materialId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    return comments.map((c) => ({
      id: c.id,
      materialId: c.materialId,
      userId: c.userId,
      body: c.body,
      createdAt: c.createdAt,
      userName: c.user?.name,
    }));
  }

  async addComment(materialId: string, userId: string, dto: MaterialCommentInput): Promise<MaterialComment> {
    const data = materialCommentSchema.parse(dto);
    await this.findOne(materialId);
    const comment = this.commentRepo.create({
      id: uuid(),
      materialId,
      userId,
      body: data.body,
    });
    return this.commentRepo.save(comment);
  }
}
