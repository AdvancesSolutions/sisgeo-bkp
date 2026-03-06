import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TaskPhoto } from './task-photo.entity';

/** Auditoria automática de fotos (Ollama/LLaVA) - Dashboard de evidências suspeitas */
@Entity('evidencias')
export class Evidencia {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'task_photo_id' })
  taskPhotoId: string;

  @ManyToOne(() => TaskPhoto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_photo_id' })
  taskPhoto?: TaskPhoto;

  @Column({ type: 'boolean', nullable: true })
  limpo: boolean | null;

  @Column({ type: 'int', nullable: true })
  confianca: number | null;

  @Column({ type: 'text', nullable: true })
  detalhes: string | null;

  @Column({ name: 'anomalia_detectada', type: 'boolean', default: false })
  anomaliaDetectada: boolean;

  @Column({ type: 'varchar', length: 32 })
  status: string; // OK | SUSPEITA | AGUARDANDO_REVISAO_MANUAL

  @Column({ name: 'provider', type: 'varchar', length: 32 })
  provider: string; // OLLAMA | GEMINI | WEBHOOK

  @Column({ name: 'raw_response', type: 'jsonb', nullable: true })
  rawResponse: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
