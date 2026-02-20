import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('areas')
export class Area {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'location_id' })
  locationId: string;

  @Column()
  name: string;

  /** Classificação de risco: crítico, semicrítico, não crítico */
  @Column({ name: 'risk_classification', type: 'varchar', length: 20, nullable: true })
  riskClassification: string | null;

  /** Frequência de limpeza (ex: diária, 2x/dia, semanal) */
  @Column({ name: 'cleaning_frequency', type: 'varchar', length: 50, nullable: true })
  cleaningFrequency: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
