import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

/** RH-SIGHT: Score de risco de evasão (0-100, maior = mais risco) */
@Entity('risco_colaborador')
export class RiscoColaborador {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ type: 'float' })
  score: number;

  @Column({ type: 'varchar', length: 16 })
  nivel: string; // BAIXO | MEDIO | ALTO

  @Column({ type: 'jsonb', nullable: true })
  motivos: string[] | null;

  @Column({ name: 'acoes_sugeridas', type: 'jsonb', nullable: true })
  acoesSugeridas: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  detalhes: Record<string, unknown> | null;

  @Column({ name: 'reference_date', type: 'date' })
  referenceDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
