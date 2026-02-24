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

/** Ativo/Equipamento (CMMS - Asset Tracking) */
@Entity('ativos')
export class Ativo {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  modelo: string | null;

  @Column({ name: 'data_compra', type: 'date', nullable: true })
  dataCompra: Date | null;

  @Column({ name: 'numero_serie', type: 'varchar', length: 128, nullable: true })
  numeroSerie: string | null;

  @Column({ name: 'horas_uso_total', type: 'float', default: 0 })
  horasUsoTotal: number;

  @Column({ name: 'limite_manutencao_horas', type: 'float', nullable: true })
  limiteManutencaoHoras: number | null;

  @Column({ default: 'OPERACIONAL' })
  status: string; // OPERACIONAL | MANUTENCAO | CONDENADO

  @Column({ name: 'qr_code', type: 'varchar', length: 128, nullable: true })
  qrCode: string | null;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @ManyToOne(() => Location, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
