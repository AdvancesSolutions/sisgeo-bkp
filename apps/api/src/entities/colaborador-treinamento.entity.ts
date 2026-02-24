import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Procedimento } from './procedimento.entity';

/** Log de treinamentos assistidos pelo colaborador (para comprovação de conhecimento) */
@Entity('colaborador_treinamentos')
export class ColaboradorTreinamento {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @Column({ name: 'procedimento_id' })
  procedimentoId: string;

  @ManyToOne(() => Procedimento, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'procedimento_id' })
  procedimento?: Procedimento;

  @Column({ name: 'watched_at', type: 'timestamptz' })
  watchedAt: Date;

  /** Percentual assistido (0-100) para validar que viu o vídeo */
  @Column({ name: 'percentual_assistido', type: 'int', default: 100 })
  percentualAssistido: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
