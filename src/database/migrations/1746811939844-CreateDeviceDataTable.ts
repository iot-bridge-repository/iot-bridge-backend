import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateDeviceDataTable1746811939844 implements MigrationInterface {
  name = 'CreateDeviceDataTable1746811939844'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'device_data',
        columns: [
          {
            name: 'id',
            type: 'bigserial',
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
            name: 'value',
            type: 'double precision',
            isNullable: false,
          },
          {
            name: 'time',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'device_data',
      new TableForeignKey({
        columnNames: ['device_id'],
        referencedTableName: 'devices',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Optional: hapus semua data kalau device dihapus
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('device_data');
  }
}
