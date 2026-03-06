import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Insumo } from './insumo.entity';
import { Area } from './area.entity';

@Entity('estoque')
export class Estoque {
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

  @Column({ type: 'float', default: 0 })
  quantidade: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
