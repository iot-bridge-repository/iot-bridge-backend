import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { Length } from 'class-validator';

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

@Entity({ name: 'verify_email_tokens' })
export class VerifyEmailToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  user_id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', nullable: false })
  token: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

@Entity({ name: 'password_reset_tokens' })
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  user_id: string;

  @Column({ type: 'varchar', nullable: false })
  token: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  @Length(0, 1000)
  description: string | null;

  @Column({ type: 'text', nullable: true })
  organization_picture: string | null;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_verified: boolean;

  @Column({ type: 'varchar', unique: false, nullable: false })
  created_by: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

export enum OrganizationMemberRole {
  ADMIN = 'Admin',
  OPERATOR = 'Operator',
  VIEWER = 'Viewer',
}

@Entity({ name: 'organization_members' })
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: false, nullable: false })
  user_id: string;

  @Column({ type: 'varchar', unique: false, nullable: false })
  organization_id: Organization;

  @Column({ type: 'enum', enum: OrganizationMemberRole, nullable: false })
  role: OrganizationMemberRole;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joined_at: Date;
}
