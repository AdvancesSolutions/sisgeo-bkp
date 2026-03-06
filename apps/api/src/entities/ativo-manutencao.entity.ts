import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ativo } from './ativo.entity';
import { Task } from './task.entity';

/** Histórico de manutenção de ativos */
@Entity('ativo_manutencoes')
export class AtivoManutencao {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'ativo_id' })
  ativoId: string;

  @ManyToOne(() => Ativo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ativo_id' })
  ativo?: Ativo;

  @Column({ type: 'varchar', length: 32 })
  tipo: string; // PREVENTIVA | CORRETIVA | TECNICA

  @Column({ name: 'data_inicio', type: 'timestamptz' })
  dataInicio: Date;

  @Column({ name: 'data_fim', type: 'timestamptz', nullable: true })
  dataFim: Date | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ name: 'task_id', type: 'uuid', nullable: true })
  taskId: string | null;

  @ManyToOne(() => Task, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
