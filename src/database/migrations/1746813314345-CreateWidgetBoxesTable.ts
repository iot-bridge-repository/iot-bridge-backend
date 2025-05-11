import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateWidgetBoxesTable1746813314345 implements MigrationInterface {
  name = 'CreateWidgetBoxesTable1746813314345'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'widget_boxes',
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
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'pin',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'min_value',
            type: 'double precision',
            isNullable: true,
          },
          {
            name: 'max_value',
            type: 'double precision',
            isNullable: true,
          },
          {
            name: 'default_value',
            type: 'double precision',
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
      'widget_boxes',
      new TableForeignKey({
        columnNames: ['device_id'],
        referencedTableName: 'devices',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Optional: hapus semua widget_box kalau device dihapus
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('widget_boxes');
  }

}
