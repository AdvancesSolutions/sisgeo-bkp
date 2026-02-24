import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Medalha } from './medalha.entity';

@Entity('employee_medalhas')
export class EmployeeMedalha {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @Column({ name: 'medalha_id' })
  medalhaId: string;

  @ManyToOne(() => Medalha, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medalha_id' })
  medalha?: Medalha;

  @Column({ name: 'earned_at', type: 'timestamptz' })
  earnedAt: Date;

  @Column({ name: 'period_start', type: 'date', nullable: true })
  periodStart: Date | null;

  @Column({ name: 'period_end', type: 'date', nullable: true })
  periodEnd: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
