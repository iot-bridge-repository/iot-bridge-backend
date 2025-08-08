import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

export enum UserRole {
  ADMIN_SYSTEM = 'Admin System',
  REGULAR_USER = 'Regular User',
  LOCAL_MEMBER = 'Local Member',
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

  @Column({ type: 'enum', enum: UserRole, default: UserRole.REGULAR_USER, })
  role: UserRole;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_email_verified: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @OneToMany(() => OrganizationMember, (organization_member) => organization_member.user)
  organization_members: OrganizationMember[];

  @OneToMany(() => Organization, Organization => Organization.created_by)
  created_organizations: Organization[];
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

@Entity({ name: 'reset_password_tokens' })
export class ResetPasswordToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  user_id: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  token: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

export enum OrganizationStatus {
  PENDING = 'Pending',
  VERIFIED = 'Verified',
  UNVERIFIED = 'Unverified',
}

@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  organization_picture: string | null;

  @Column({ type: 'enum', enum: OrganizationStatus, default: OrganizationStatus.PENDING, })
  status: OrganizationStatus;

  @Column({ type: 'varchar', unique: false, nullable: false })
  created_by: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => User, User => User.created_organizations)
  @JoinColumn({ name: 'created_by' })
  user: User;

  @OneToMany(() => OrganizationMember, OrganizationMember => OrganizationMember.organization)
  members: OrganizationMember[];
}

export enum OrganizationMemberRole {
  ADMIN = 'Admin',
  OPERATOR = 'Operator',
  VIEWER = 'Viewer',
}

export enum OrganizationMemberStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
}

@Entity({ name: 'organization_members' })
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: false, nullable: false })
  user_id: string;

  @Column({ type: 'varchar', unique: false, nullable: false })
  organization_id: string;

  @Column({ type: 'enum', enum: OrganizationMemberRole, nullable: false })
  role: OrganizationMemberRole;

  @Column({ type: 'enum', enum: OrganizationMemberStatus, default: OrganizationMemberStatus.PENDING, nullable: false })
  status: OrganizationMemberStatus;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joined_at: Date;

  @ManyToOne(() => User, User => User.organization_members)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, Organization => Organization.members)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}

@Entity({ name: 'user_notifications' })
export class UserNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: false, nullable: false })
  user_id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  subject: string;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  type: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

@Entity({ name: 'devices' })
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: false, nullable: false })
  organization_id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 36, unique: true, nullable: false })
  auth_code: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

@Entity({ name: 'widget_boxes' })
export class WidgetBox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: false, nullable: false })
  device_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pin: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string;

  @Column({ type: 'double precision', nullable: true })
  min_value: string;

  @Column({ type: 'double precision', nullable: true })
  max_value: string;

  @Column({ type: 'double precision', nullable: true })
  default_value: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

@Entity({ name: 'device_data' })
export class DeviceData {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', unique: false, nullable: false })
  device_id: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  pin: string;

  @Column({ type: 'double precision', nullable: false })
  value: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  time: Date;
}

export enum ComparisonType {
  EQUAL = '=',
  GREATER = '>',
  LESSER = '<',
  GREATER_OR_EQUAL = '>=',
  LESSER_OR_EQUAL = '<=',
  NOT_EQUAL = '!='
}

@Entity({ name: 'notification_events' })
export class NotificationEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: false, nullable: false })
  device_id: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  pin: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  subject: string;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({ type: 'enum', enum: ComparisonType, default: ComparisonType.EQUAL, nullable: false })
  comparison_type: ComparisonType;

  @Column({ type: 'double precision', nullable: false })
  threshold_value: string;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_active: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  last_triggered: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_triggered_at: Date | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
