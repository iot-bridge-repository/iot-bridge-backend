import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateEnvironmentsTable1746688303540 implements MigrationInterface {
  name = 'CreateEnvironmentsTable1746688303540'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'environments',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'organization_id',
            type: 'varchar',
            isUnique: false,
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: false,
            isNullable: false,
          },
          {
            name: 'topic_code',
            type: 'varchar',
            length: '36',
            isUnique: true,
            isNullable: false,
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
      'environments',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Optional: hapus semua environment kalau organisasi dihapus
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('environments');
  }
}
