import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1741505126260 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Jika PostgreSQL, buat ENUM secara eksplisit
    const isPostgres = queryRunner.connection.options.type === "postgres";
    if (isPostgres) {
      await queryRunner.query(`
        DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
              CREATE TYPE "user_role_enum" AS ENUM ('Admin System', 'Regular User');
            END IF;
        END $$;
      `);
    }

    await queryRunner.query(`
      CREATE TABLE users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(15) UNIQUE NOT NULL,
        username VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        profile_picture TEXT,
        role ${isPostgres ? `"user_role_enum"` : `ENUM('Admin System', 'Regular User')`} NOT NULL DEFAULT 'Regular User',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
