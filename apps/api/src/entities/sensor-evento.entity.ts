import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sensor } from './sensor.entity';

@Entity('sensor_eventos')
export class SensorEvento {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'sensor_id' })
  sensorId: string;

  @ManyToOne(() => Sensor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sensor_id' })
  sensor?: Sensor;

  @Column({ type: 'varchar', length: 32 })
  eventType: string; // CLICK | PRESENCA | THRESHOLD_ATINGIDO

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
