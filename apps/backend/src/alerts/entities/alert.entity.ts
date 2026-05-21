import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

export type AlertType =
  | 'low_fuel'
  | 'high_temperature'
  | 'speeding'
  | 'offline';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  vehicle_id!: string;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column({
    type: 'enum',
    enum: ['low_fuel', 'high_temperature', 'speeding', 'offline'],
  })
  type!: AlertType;

  @Column()
  message!: string;

  @Column({ default: false })
  resolved!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolved_at!: Date | null;
}
