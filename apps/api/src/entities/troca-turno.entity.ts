import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Location } from './location.entity';

/** Livro Ata Digital - Troca de plantão */
@Entity('troca_turno')
export class TrocaTurno {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'location_id' })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @Column({ name: 'employee_saida_id' })
  employeeSaidaId: string;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_saida_id' })
  employeeSaida?: Employee;

  @Column({ name: 'employee_entrada_id' })
  employeeEntradaId: string;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_entrada_id' })
  employeeEntrada?: Employee;

  @Column({ name: 'data_troca', type: 'date' })
  dataTroca: Date;

  @Column({ name: 'observacoes_saida', type: 'text', nullable: true })
  observacoesSaida: string | null;

  @Column({ name: 'observacoes_entrada', type: 'text', nullable: true })
  observacoesEntrada: string | null;

  @Column({ name: 'validado_entrada', type: 'boolean', default: false })
  validadoEntrada: boolean;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
