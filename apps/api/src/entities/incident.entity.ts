import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Area } from './area.entity';

@Entity('incidents')
export class Incident {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ name: 'supervisor_id', nullable: true })
  supervisorId: string | null;

  @Column({ type: 'varchar', length: 64 })
  type: string; // FALTA_MATERIAL | QUEBRA_EQUIPAMENTO | OUTRO

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'ABERTO' })
  status: string; // ABERTO | EM_ANALISE | RESOLVIDO | FECHADO

  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId: string | null;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor?: User;

  @ManyToOne(() => Area, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'area_id' })
  area?: Area;
}
