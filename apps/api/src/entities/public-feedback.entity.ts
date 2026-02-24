import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Area } from './area.entity';
import { Task } from './task.entity';

/** Feedback público via QR Code (sem autenticação) */
@Entity('public_feedback')
export class PublicFeedback {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'area_id' })
  areaId: string;

  @ManyToOne(() => Area, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @Column({ type: 'int' })
  rating: number;

  @Column({ name: 'alert_type', type: 'varchar', length: 64, nullable: true })
  alertType: string | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 1024, nullable: true })
  photoUrl: string | null;

  @Column({ name: 'task_id', type: 'uuid', nullable: true })
  taskId: string | null;

  @ManyToOne(() => Task, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
