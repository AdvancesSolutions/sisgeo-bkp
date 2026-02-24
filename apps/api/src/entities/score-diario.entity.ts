import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Area } from './area.entity';
import { Location } from './location.entity';
import { Organization } from './organization.entity';

/** FindMe Score (0-100) por setor/área, calculado diariamente */
@Entity('scores_diarios')
export class ScoreDiario {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'reference_date', type: 'date' })
  referenceDate: Date;

  @Column({ name: 'area_id' })
  areaId: string;

  @ManyToOne(() => Area, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @Column({ name: 'location_id' })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @ManyToOne(() => Organization, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  /** Score final 0-100 (FindMe Score) */
  @Column({ name: 'score_total', type: 'int' })
  scoreTotal: number;

  /** Pontuação de pontualidade (0-100) */
  @Column({ name: 'score_pontualidade', type: 'int' })
  scorePontualidade: number;

  /** Pontuação de conformidade (checklists aprovados) (0-100) */
  @Column({ name: 'score_conformidade', type: 'int' })
  scoreConformidade: number;

  /** Penalidade por ocorrências abertas (0-100, onde 100 = sem penalidade) */
  @Column({ name: 'score_ocorrencias', type: 'int' })
  scoreOcorrencias: number;

  @Column({ name: 'tasks_total', type: 'int', default: 0 })
  tasksTotal: number;

  @Column({ name: 'tasks_done', type: 'int', default: 0 })
  tasksDone: number;

  @Column({ name: 'tasks_on_time', type: 'int', default: 0 })
  tasksOnTime: number;

  @Column({ name: 'ocorrencias_abertas', type: 'int', default: 0 })
  ocorrenciasAbertas: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
