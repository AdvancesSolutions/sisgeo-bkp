import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TaskPhoto } from './task-photo.entity';

/** Resultado da validação IA (Gemini/Rekognition) em foto de limpeza */
@Entity('ai_check_results')
export class AiCheckResult {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'task_photo_id' })
  taskPhotoId: string;

  @ManyToOne(() => TaskPhoto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_photo_id' })
  taskPhoto?: TaskPhoto;

  @Column({ type: 'varchar', length: 32 })
  provider: string; // GEMINI | REKOGNITION

  @Column({ type: 'varchar', length: 32 })
  status: string; // APROVADO | REPROVADO | INDETERMINADO

  @Column({ type: 'float', nullable: true })
  confidence: number | null;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null; // manchas detectadas, etc

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
