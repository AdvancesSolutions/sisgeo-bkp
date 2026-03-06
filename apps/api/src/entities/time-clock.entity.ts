import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('time_clocks')
export class TimeClock {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column()
  type: string;

  @Column({ type: 'float', nullable: true })
  lat: number | null;

  @Column({ type: 'float', nullable: true })
  lng: number | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 1024, nullable: true })
  photoUrl: string | null;

  @Column({ name: 'photo_key', type: 'varchar', length: 512, nullable: true })
  photoKey: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
