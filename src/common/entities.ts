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

  @Column({ length: 255, unique: true, nullable: true })
  email: string;

  @Column({ length: 15, unique: true, nullable: true })
  phone_number: string;

  @Column({ length: 20, unique: true, nullable: false })
  username: string;

  @Column({ nullable: false })
  password: string;

  @Column({ type: 'text', nullable: true })
  profile_picture: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.REGULAR_USER,
  })
  role: UserRole;

  @Column({ default: false })
  is_email_verified: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  organization_picture: string | null;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ type: 'varchar', length: 36, nullable: false })
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

  @Column({ type: 'enum', enum: OrganizationMemberRole, nullable: false })
  role: OrganizationMemberRole;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joined_at: Date;

  @Column({ type: 'varchar', length: 36, nullable: false })
  user_id: string;

  @Column({ type: 'varchar', length: 36, nullable: false })
  organization_id: Organization;
}
