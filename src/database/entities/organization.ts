import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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
}
