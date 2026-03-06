import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from './task.entity';
import { ChecklistItem } from './checklist-item.entity';

@Entity('task_checklist_responses')
export class TaskChecklistResponse {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @Column({ name: 'checklist_item_id' })
  checklistItemId: string;

  @ManyToOne(() => ChecklistItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklist_item_id' })
  checklistItem?: ChecklistItem;

  /** Valor conforme inputType: boolean (CHECKBOX), string (TEXT ou URL da PHOTO) */
  @Column({ name: 'value_text', type: 'text', nullable: true })
  valueText: string | null;

  @Column({ name: 'value_bool', type: 'boolean', nullable: true })
  valueBool: boolean | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
