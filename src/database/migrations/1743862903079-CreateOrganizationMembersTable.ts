import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateOrganizationMembersTable1743862903079 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organization_members',
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
            isUnique: false,
            isNullable: false,
          },
          {
            name: 'organization_id',
            type: 'varchar',
            isUnique: false,
            isNullable: false,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['Admin', 'Operator', 'Viewer'],
            isNullable: false,
          },
          {
            name: 'joined_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'organization_members',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Optional: hapus member kalau user dihapus
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'organization_members',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Optional: hapus semua member kalau organisasi dihapus
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('organization_members');
    await queryRunner.query('DROP TYPE IF EXISTS organization_members_role_enum');
  }
}
