import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateResetPasswordTokensTable1745210932627 implements MigrationInterface {
  name = 'CreateResetPasswordTokensTable1745210932627'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'reset_password_tokens',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'token',
            type: 'varchar',
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
      'reset_password_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Optional: hapus token kalau user dihapus
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('reset_password_tokens');
  }
}
