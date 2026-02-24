import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ChecklistItem } from '../../entities/checklist-item.entity';
import { TaskChecklistResponse } from '../../entities/task-checklist-response.entity';
import { Area } from '../../entities/area.entity';
import { Task } from '../../entities/task.entity';
import { SuprimentosService } from '../suprimentos/suprimentos.service';
import {
  checklistItemSchema,
  checklistItemUpdateSchema,
  taskChecklistResponseSchema,
} from '@sigeo/shared';
import type {
  ChecklistItemInput,
  ChecklistItemUpdateInput,
  TaskChecklistResponseInput,
} from '@sigeo/shared';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectRepository(ChecklistItem)
    private readonly itemRepo: Repository<ChecklistItem>,
    @InjectRepository(TaskChecklistResponse)
    private readonly responseRepo: Repository<TaskChecklistResponse>,
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly suprimentos: SuprimentosService,
  ) {}

  async findItemsByCleaningType(cleaningTypeId: string): Promise<ChecklistItem[]> {
    return this.itemRepo.find({
      where: { cleaningTypeId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  /** Itens do checklist para uma tarefa (via área -> cleaning_type). */
  async findItemsByTaskId(taskId: string): Promise<ChecklistItem[]> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['area'],
    });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    const area = task.area ?? (await this.areaRepo.findOne({ where: { id: task.areaId } }));
    if (!area?.cleaningTypeId) return [];
    return this.itemRepo.find({
      where: { cleaningTypeId: area.cleaningTypeId },
      relations: ['procedimento'],
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findResponsesByTaskId(taskId: string): Promise<TaskChecklistResponse[]> {
    return this.responseRepo.find({
      where: { taskId },
      relations: ['checklistItem'],
    });
  }

  async saveResponses(taskId: string, responses: TaskChecklistResponseInput[]): Promise<{ saved: number }> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    if (task.status !== 'PENDING' && task.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Só é possível salvar checklist em tarefa PENDING ou IN_PROGRESS');
    }

    let saved = 0;
    for (const r of responses) {
      const data = taskChecklistResponseSchema.parse(r);
      const existing = await this.responseRepo.findOne({
        where: { taskId, checklistItemId: data.checklistItemId },
      });
      const newValueBool = data.valueBool ?? existing?.valueBool ?? null;
      const wasAlreadyTrue = existing?.valueBool === true;
      if (existing) {
        await this.responseRepo.update(existing.id, {
          valueBool: newValueBool,
          valueText: data.valueText ?? existing.valueText,
        });
      } else {
        const e = this.responseRepo.create({
          id: uuid(),
          taskId,
          checklistItemId: data.checklistItemId,
          valueBool: newValueBool,
          valueText: data.valueText ?? null,
        });
        await this.responseRepo.save(e);
      }
      if (newValueBool === true && !wasAlreadyTrue) {
        try {
          await this.suprimentos.processarConsumo(
            data.checklistItemId,
            taskId,
            true,
          );
        } catch {
          // não falhar o save do checklist se o abate falhar
        }
      }
      saved++;
    }
    return { saved };
  }

  async createItem(dto: ChecklistItemInput): Promise<ChecklistItem> {
    const data = checklistItemSchema.parse(dto);
    const e = this.itemRepo.create({ id: uuid(), ...data });
    return this.itemRepo.save(e);
  }

  async updateItem(id: string, dto: ChecklistItemUpdateInput): Promise<ChecklistItem> {
    const data = checklistItemUpdateSchema.parse(dto);
    await this.itemRepo.update(id, data as Partial<ChecklistItem>);
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Item não encontrado');
    return item;
  }

  async removeItem(id: string): Promise<void> {
    await this.itemRepo.delete(id);
  }
}
