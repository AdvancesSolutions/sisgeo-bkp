import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CleaningType } from './cleaning-type.entity';
import { Procedimento } from './procedimento.entity';
import { Insumo } from './insumo.entity';

/** Tipos de input do checklist: CHECKBOX, PHOTO, TEXT */
export const CHECKLIST_INPUT_TYPES = ['CHECKBOX', 'PHOTO', 'TEXT'] as const;
export type ChecklistInputType = (typeof CHECKLIST_INPUT_TYPES)[number];

@Entity('checklist_items')
export class ChecklistItem {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'cleaning_type_id' })
  cleaningTypeId: string;

  @ManyToOne(() => CleaningType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cleaning_type_id' })
  cleaningType?: CleaningType;

  @Column()
  label: string;

  @Column({ name: 'input_type', type: 'varchar', length: 20 })
  inputType: ChecklistInputType;

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'procedimento_id', type: 'uuid', nullable: true })
  procedimentoId: string | null;

  @ManyToOne(() => Procedimento, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'procedimento_id' })
  procedimento?: Procedimento;

  /** Quando marcado no checklist, abate 1 unidade do estoque do setor */
  @Column({ name: 'insumo_id', type: 'uuid', nullable: true })
  insumoId: string | null;

  @ManyToOne(() => Insumo, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'insumo_id' })
  insumo?: Insumo;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
