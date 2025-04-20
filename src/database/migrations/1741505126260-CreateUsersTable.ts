import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1741505126260 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '20',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '15',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'password',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'profile_picture',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['Admin System', 'Regular User', 'Lokal Member'],
            default: `'Regular User'`,
            isNullable: false,
          },
          {
            name: 'is_email_verified',
            type: 'boolean',
            default: false,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
