import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type VehicleCity =
  | 'medellin'
  | 'bogota'
  | 'cali'
  | 'barranquilla'
  | 'cartagena'
  | 'bucaramanga';

export type VehicleStatus = 'active' | 'inactive';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  device_id!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: [
      'medellin',
      'bogota',
      'cali',
      'barranquilla',
      'cartagena',
      'bucaramanga',
    ],
  })
  city!: VehicleCity;

  @Column({ type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status!: VehicleStatus;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany('Telemetry', 'vehicle')
  telemetry!: unknown[];

  @OneToMany('Alert', 'vehicle')
  alerts!: unknown[];
}
