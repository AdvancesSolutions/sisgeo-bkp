import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Area } from './area.entity';
import { Location } from './location.entity';

/** Sensores IoT (presença, botão físico Dash-style) */
@Entity('sensores')
export class Sensor {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 64 })
  type: string; // PRESENCA | BOTAO_INSUMO | FLUXO

  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => Area, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @ManyToOne(() => Location, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @Column({ name: 'device_id', type: 'varchar', length: 128 })
  deviceId: string; // ID do dispositivo físico

  @Column({ name: 'threshold_pessoas', type: 'int', nullable: true })
  thresholdPessoas: number | null; // após X pessoas, gera tarefa de limpeza

  @Column({ name: 'material_id', type: 'uuid', nullable: true })
  materialId: string | null; // para botão de insumo: qual material repor

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
