import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('telemetry')
export class Telemetry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  vehicle_id!: string;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  speed!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  fuel_level!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperature!: number | null;

  @Column({ type: 'timestamp' })
  timestamp!: Date;
}
