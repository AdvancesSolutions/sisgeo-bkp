import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TaskPhoto } from './task-photo.entity';
import { Employee } from './employee.entity';

/** Feed de boas práticas (fotos exemplares compartilhadas) */
@Entity('boas_praticas')
export class BoasPraticas {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'task_photo_id' })
  taskPhotoId: string;

  @ManyToOne(() => TaskPhoto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_photo_id' })
  taskPhoto?: TaskPhoto;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @Column({ type: 'text', nullable: true })
  caption: string | null;

  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
