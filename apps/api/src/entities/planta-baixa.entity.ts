import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Location } from './location.entity';

/** Planta baixa (imagem SVG/PNG) por andar/unidade */
@Entity('plantas_baixa')
export class PlantaBaixa {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'location_id' })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @Column({ name: 'floor_number', type: 'int', default: 1 })
  floorNumber: number;

  @Column({ name: 'image_url', type: 'varchar', length: 1024 })
  imageUrl: string;

  @Column({ name: 'image_key', type: 'varchar', length: 512, nullable: true })
  imageKey: string | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
