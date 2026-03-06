import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Produtos químicos para cálculo ESG (pegada hídrica, resíduos) */
@Entity('produtos_quimicos')
export class ProdutoQuimico {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  categoria: string | null; // saneante, desinfetante, etc

  @Column({ name: 'litros_por_uso', type: 'float', nullable: true })
  litrosPorUso: number | null;

  @Column({ name: 'pegada_hidrica_por_litro', type: 'float', nullable: true })
  pegadaHidricaPorLitro: number | null; // m³ água virtual

  @Column({ name: 'residuo_kg_por_uso', type: 'float', nullable: true })
  residuoKgPorUso: number | null;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
