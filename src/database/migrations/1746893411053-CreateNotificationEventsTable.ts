import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateNotificationEventsTable1746893411053 implements MigrationInterface {
  name = 'CreateNotificationEventsTable1746893411053'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notification_events',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'device_id',
            type: 'varchar',
            isUnique: false,
            isNullable: false,
          },
          {
            name: 'pin',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'comparison_type',
            type: 'enum',
            enum: ['=', '>', '<', '>=', '<=', '!='],
            isNullable: false,
          },
          {
            name: 'threshold_value',
            type: 'double precision',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'last_triggered',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'last_triggered_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'notification_events',
      new TableForeignKey({
        columnNames: ['device_id'],
        referencedTableName: 'devices',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Optional: hapus semua notification events kalau device dihapus
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notification_events');
    await queryRunner.query('DROP TYPE IF EXISTS notification_events_comparison_type_enum');
  }
}
