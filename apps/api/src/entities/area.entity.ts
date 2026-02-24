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

@Entity('areas')
export class Area {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @Column()
  name: string;

  /** Classificação de risco: crítico, semicrítico, não crítico */
  @Column({ name: 'risk_classification', type: 'varchar', length: 20, nullable: true })
  riskClassification: string | null;

  /** Frequência de limpeza (ex: diária, 2x/dia, semanal) */
  @Column({ name: 'cleaning_frequency', type: 'varchar', length: 50, nullable: true })
  cleaningFrequency: string | null;

  /** Raio permitido em km para geofencing (usa Location se null) */
  @Column({ name: 'raio_permitido', type: 'float', nullable: true })
  raioPermitido: number | null;

  @Column({ name: 'cleaning_type_id', type: 'uuid', nullable: true })
  cleaningTypeId: string | null;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
