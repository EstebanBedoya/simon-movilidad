import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password_hash!: string;

  @Column({ type: 'enum', enum: ['admin', 'user'], default: 'user' })
  role!: 'admin' | 'user';

  @CreateDateColumn()
  created_at!: Date;
}
