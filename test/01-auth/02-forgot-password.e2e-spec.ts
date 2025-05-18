import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { User } from 'src/common/entities';

describe('Auth Controller (e2e)', () => {
  let app: NestExpressApplication;
  const email = 'userTest2@example.com';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Middleware for security
    app.use(helmet());
    // Pipes configuration
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Only allow properties that are defined in the DTO
        forbidNonWhitelisted: true, // Reject requests with non-whitelisted properties
        transform: true, // Transform payloads to DTO instances
      }),
    );
    // Filter configuration
    app.useGlobalFilters(new HttpExceptionFilter());

    app.setBaseViewsDir(join(__dirname, '..', '..', 'src', 'common', 'views'));
    app.setViewEngine('hbs');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Forgot Password
  it('successfully forgot password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({
        email,
      });

    console.log('successfully forgot password response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed forgot password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({
        email: 'test@example.co',
      });

    console.log('failed forgot password response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Get reset password 
  it('successfully get reset password', async () => {
    const dataSource = app.get(DataSource);
    const resetPasswordToken = await dataSource.getRepository(User)
      .createQueryBuilder('u')
      .leftJoin('reset_password_tokens', 'prt', 'u.id = prt.user_id')
      .select([
        'prt.token AS token',
      ])
      .where('u.email = :email', { email })
      .getRawOne();

    const res = await request(app.getHttpServer())
      .get(`/auth/reset-password/${resetPasswordToken.token}`);

    console.log('successfully get reset password response:', res.text);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed get reset password', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/reset-password/invalid_token');

    console.log('failed get reset password response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Post reset password
  it('successfully post reset password', async () => {
    const dataSource = app.get(DataSource);
    const resetPasswordToken = await dataSource.getRepository(User)
      .createQueryBuilder('u')
      .leftJoin('reset_password_tokens', 'prt', 'u.id = prt.user_id')
      .select([
        'prt.token AS token',
      ])
      .where('u.email = :email', { email })
      .getRawOne();

    const res = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ 
        token: resetPasswordToken?.token,
        new_password: '12345678',
      });

    console.log('successfully post reset password response:', res.text);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed post reset password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ 
        token: 'invalid_token',
        new_password: '12345678',
      });

    console.log('failed post reset password response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
