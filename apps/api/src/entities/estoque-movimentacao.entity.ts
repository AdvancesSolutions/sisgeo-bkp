import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Material } from './material.entity';
import { Employee } from './employee.entity';

/** Movimentação de estoque (QR Code scan, abate automático) */
@Entity('estoque_movimentacoes')
export class EstoqueMovimentacao {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'material_id' })
  materialId: string;

  @ManyToOne(() => Material, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material?: Material;

  @Column({ type: 'varchar', length: 32 })
  tipo: string; // ENTRADA | SAIDA | AJUSTE | SCAN_QR

  @Column({ type: 'int' })
  quantidade: number;

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @Column({ name: 'qr_code', type: 'varchar', length: 128, nullable: true })
  qrCode: string | null;

  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
