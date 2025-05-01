import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN_SYSTEM = 'Admin System',
  REGULAR_USER = 'Regular User',
  LOKAL_MEMBER = 'Lokal Member',
}

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  username: string;
  
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 15, unique: true, nullable: true })
  phone_number: string | null;

  @Column({ type: 'varchar', nullable: false })
  password: string;

  @Column({ type: 'text', nullable: true })
  profile_picture: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.REGULAR_USER,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_email_verified: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}