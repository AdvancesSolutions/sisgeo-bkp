import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Location } from './location.entity';

@Entity('materials')
export class Material {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  unit: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'qr_code', type: 'varchar', length: 128, nullable: true })
  qrCode: string | null;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @ManyToOne(() => Location, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
