import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Area } from './area.entity';
import { CleaningType } from './cleaning-type.entity';

/** Procedimento de treinamento Just-in-Time (vídeo/manual por setor ou tipo de limpeza) */
@Entity('procedimentos')
export class Procedimento {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @ManyToOne(() => Area, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @Column({ name: 'cleaning_type_id', type: 'uuid', nullable: true })
  cleaningTypeId: string | null;

  @ManyToOne(() => CleaningType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cleaning_type_id' })
  cleaningType?: CleaningType;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ name: 'video_url_s3', type: 'varchar', length: 1024, nullable: true })
  videoUrlS3: string | null;

  @Column({ name: 'manual_pdf_url', type: 'varchar', length: 1024, nullable: true })
  manualPdfUrl: string | null;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 1024, nullable: true })
  thumbnailUrl: string | null;

  @Column({ name: 'duracao_segundos', type: 'int', nullable: true })
  duracaoSegundos: number | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
