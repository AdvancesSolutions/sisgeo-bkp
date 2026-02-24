import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Insumo } from './insumo.entity';
import { Area } from './area.entity';
import { Fornecedor } from './fornecedor.entity';

export type PedidoCompraStatus = 'RASCUNHO' | 'APROVADO' | 'ENVIADO' | 'RECEBIDO';

@Entity('pedidos_compra')
export class PedidoCompra {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'insumo_id' })
  insumoId: string;

  @ManyToOne(() => Insumo, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'insumo_id' })
  insumo?: Insumo;

  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => Area, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @Column({ name: 'fornecedor_id', type: 'uuid', nullable: true })
  fornecedorId: string | null;

  @ManyToOne(() => Fornecedor, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fornecedor_id' })
  fornecedor?: Fornecedor;

  @Column({ type: 'float' })
  quantidade: number;

  @Column({ type: 'varchar', length: 32, default: 'RASCUNHO' })
  status: string;

  @Column({ name: 'preco_unitario', type: 'decimal', precision: 12, scale: 2, nullable: true })
  precoUnitario: number | null;

  @Column({ name: 'preco_total', type: 'decimal', precision: 12, scale: 2, nullable: true })
  precoTotal: number | null;

  @Column({ name: 'data_prevista_entrega', type: 'date', nullable: true })
  dataPrevistaEntrega: Date | null;

  @Column({ name: 'data_recebimento', type: 'timestamptz', nullable: true })
  dataRecebimento: Date | null;

  @Column({ name: 'nf_codigo', type: 'varchar', length: 64, nullable: true })
  nfCodigo: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
