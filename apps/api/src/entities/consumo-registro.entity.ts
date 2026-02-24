import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Insumo } from './insumo.entity';
import { Area } from './area.entity';
import { Task } from './task.entity';

@Entity('consumo_registro')
export class ConsumoRegistro {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'insumo_id' })
  insumoId: string;

  @ManyToOne(() => Insumo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'insumo_id' })
  insumo?: Insumo;

  @Column({ name: 'area_id' })
  areaId: string;

  @ManyToOne(() => Area, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @Column({ name: 'task_id', type: 'uuid', nullable: true })
  taskId: string | null;

  @ManyToOne(() => Task, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @Column({ type: 'float', default: 1 })
  quantidade: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
