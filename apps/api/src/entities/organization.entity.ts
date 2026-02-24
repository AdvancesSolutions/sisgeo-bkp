import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Region } from './region.entity';

@Entity('organizations')
export class Organization {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'region_id', type: 'uuid', nullable: true })
  regionId: string | null;

  @ManyToOne(() => Region, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'region_id' })
  region?: Region;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  slug: string | null;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
