import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('sla_alerts')
export class SlaAlert {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @Column({ name: 'alert_type', type: 'varchar', length: 32 })
  alertType: string; // SLA_ATRASO_SETOR_CRITICO

  @Column({ name: 'minutes_late', type: 'int' })
  minutesLate: number;

  @Column({ name: 'notification_sent', type: 'boolean', default: false })
  notificationSent: boolean;

  @Column({ name: 'notification_channel', type: 'varchar', length: 32, nullable: true })
  notificationChannel: string | null; // EMAIL | PUSH

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
