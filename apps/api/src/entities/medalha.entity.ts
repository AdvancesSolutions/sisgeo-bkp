import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Medalhas virtuais para gamificação (Employee Score) */
@Entity('medalhas')
export class Medalha {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 64 })
  icon: string; // emoji ou nome do ícone

  @Column({ type: 'int', default: 0 })
  pontosRequeridos: number; // pontos necessários para desbloquear

  @Column({ name: 'score_minimo', type: 'int', nullable: true })
  scoreMinimo: number | null; // FindMe Score mínimo no período

  @Column({ type: 'varchar', length: 32 })
  category: string; // CONFORMIDADE | PONTUALIDADE | EXCELENCIA | ESTRELA

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
