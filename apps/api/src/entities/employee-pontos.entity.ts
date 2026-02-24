import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

/** Pontos acumulados por colaborador (gamificação, troca por benefícios/folgas) */
@Entity('employee_pontos')
export class EmployeePontos {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @Column({ type: 'int', default: 0 })
  pontos: number;

  @Column({ name: 'periodo', type: 'varchar', length: 7 })
  periodo: string; // YYYY-MM

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
