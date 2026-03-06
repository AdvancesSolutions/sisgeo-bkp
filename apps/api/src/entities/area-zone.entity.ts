import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Area } from './area.entity';
import { PlantaBaixa } from './planta-baixa.entity';

/** Coordenadas X,Y (em % 0-100) do polígono que mapeia a área na planta baixa */
export interface PolygonPoint {
  x: number;
  y: number;
}

@Entity('area_zones')
export class AreaZone {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'area_id' })
  areaId: string;

  @ManyToOne(() => Area, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @Column({ name: 'planta_baixa_id' })
  plantaBaixaId: string;

  @ManyToOne(() => PlantaBaixa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planta_baixa_id' })
  plantaBaixa?: PlantaBaixa;

  /** Array de {x, y} em percentual (0-100) da imagem */
  @Column({ type: 'jsonb' })
  polygon: PolygonPoint[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
