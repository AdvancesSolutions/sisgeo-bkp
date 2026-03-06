import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistItem } from '../../entities/checklist-item.entity';
import { TaskChecklistResponse } from '../../entities/task-checklist-response.entity';
import { Area } from '../../entities/area.entity';
import { Task } from '../../entities/task.entity';
import { SuprimentosModule } from '../suprimentos/suprimentos.module';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChecklistItem, TaskChecklistResponse, Area, Task]),
    SuprimentosModule,
  ],
  controllers: [ChecklistController],
  providers: [ChecklistService],
  exports: [ChecklistService],
})
export class ChecklistModule {}
