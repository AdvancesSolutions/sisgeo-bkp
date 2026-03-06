import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Area } from './area.entity';
import { Employee } from './employee.entity';
import { Ativo } from './ativo.entity';

@Entity('tasks')
export class Task {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'area_id', type: 'uuid' })
  areaId: string;

  @ManyToOne(() => Area, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @Column({ name: 'scheduled_date', type: 'date' })
  scheduledDate: Date;

  @Column({ name: 'scheduled_time', type: 'varchar', length: 5, nullable: true })
  scheduledTime: string | null;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'rejected_comment', type: 'text', nullable: true })
  rejectedComment: string | null;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt: Date | null;

  @Column({ name: 'rejected_by', type: 'uuid', nullable: true })
  rejectedBy: string | null;

  @Column({ name: 'estimated_minutes', type: 'int', nullable: true })
  estimatedMinutes: number | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'checkin_lat', type: 'float', nullable: true })
  checkinLat: number | null;

  @Column({ name: 'checkin_lng', type: 'float', nullable: true })
  checkinLng: number | null;

  @Column({ name: 'checkout_lat', type: 'float', nullable: true })
  checkoutLat: number | null;

  @Column({ name: 'checkout_lng', type: 'float', nullable: true })
  checkoutLng: number | null;

  @Column({ name: 'sla_alerted_at', type: 'timestamptz', nullable: true })
  slaAlertedAt: Date | null;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ name: 'ativo_id', type: 'uuid', nullable: true })
  ativoId: string | null;

  @Column({ name: 'ativo_horas_somadas', type: 'boolean', default: false })
  ativoHorasSomadas: boolean;

  @ManyToOne(() => Ativo, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ativo_id' })
  ativo?: Ativo;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('TaskPhoto', 'task')
  photos?: { id: string; type: string; url: string; key: string; createdAt: Date }[];
}
