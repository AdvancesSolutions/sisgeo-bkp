import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TrocaTurno } from './troca-turno.entity';

@Entity('troca_turno_fotos')
export class TrocaTurnoFoto {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'troca_turno_id' })
  trocaTurnoId: string;

  @ManyToOne(() => TrocaTurno, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'troca_turno_id' })
  trocaTurno?: TrocaTurno;

  @Column({ type: 'varchar', length: 16 })
  type: string; // SAIDA | ENTRADA

  @Column({ type: 'varchar', length: 1024 })
  url: string;

  @Column({ type: 'varchar', length: 512 })
  key: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
