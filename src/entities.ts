import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { Matches, Length } from "class-validator";

@Entity({ name: 'otp' })
export class Otp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column()
  otp: string;

  @Column({ type: 'enum', enum: ['email', 'phone_number'] })
  type: 'email' | 'phone_number';

  @CreateDateColumn()
  created_at: Date;
}

export enum UserRole {
  ADMIN_SYSTEM = 'Admin System',
  REGULAR_USER = 'Regular User',
}

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255, nullable: false })
  email: string;

  @Column({ unique: true, length: 15, nullable: false })
  @Matches(/^\d+$/, { message: 'Phone number must be a number' })
  phone_number: string;

  @Column({ unique: true, length: 20, nullable: false })
  username: string;

  @Column({ nullable: false })
  @Length(60, 72, { message: 'Password must be between 6 and 20 characters' })
  password: string;

  @Column({ type: 'text', nullable: true })
  profile_picture: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.REGULAR_USER,
  })
  role: UserRole;

  @CreateDateColumn()
  created_at: Date;
}

