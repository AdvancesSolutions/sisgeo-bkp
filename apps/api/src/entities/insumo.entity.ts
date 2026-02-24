import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Fornecedor } from './fornecedor.entity';

@Entity('insumos')
export class Insumo {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ name: 'unidade_medida', type: 'varchar', length: 32 })
  unidadeMedida: string;

  @Column({ name: 'estoque_minimo', type: 'float', default: 0 })
  estoqueMinimo: number;

  @Column({ name: 'preco_medio', type: 'decimal', precision: 12, scale: 2, nullable: true })
  precoMedio: number | null;

  @Column({ name: 'fornecedor_preferencial_id', type: 'uuid', nullable: true })
  fornecedorPreferencialId: string | null;

  @ManyToOne(() => Fornecedor, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fornecedor_preferencial_id' })
  fornecedorPreferencial?: Fornecedor;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
