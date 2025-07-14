import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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