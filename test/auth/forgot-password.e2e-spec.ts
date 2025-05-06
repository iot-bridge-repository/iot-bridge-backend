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

describe('AuthController (e2e)', () => {
  let app: NestExpressApplication;
  const email = 'test2@example.com'; 

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
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body.message).toBe('Check your email and spam folder for a link to reset your password.');
  });

  it('failed forgot password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({
        email: 'test@example.co',
      });

    console.log('failed forgot password response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Get password reset
  it('successfully get password reset', async () => {
    const dataSource = app.get(DataSource);
    const passwordResetToken = await dataSource.getRepository(User)
      .createQueryBuilder('u')
      .leftJoin('password_reset_tokens', 'prt', 'u.id = prt.user_id')
      .select([
        'prt.token AS token',
      ])
      .where('u.email = :email', { email })
      .getRawOne();

    const res = await request(app.getHttpServer())
      .get('/auth/password-reset')
      .query({ token: passwordResetToken?.token });

    console.log('successfully get password reset response:', res.text);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed get password reset', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/password-reset')
      .query({ token: 'invalid_token' });

    console.log('failed get password reset response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Post password reset
  it('successfully post password reset', async () => {
    const dataSource = app.get(DataSource);
    const passwordResetToken = await dataSource.getRepository(User)
      .createQueryBuilder('u')
      .leftJoin('password_reset_tokens', 'prt', 'u.id = prt.user_id')
      .select([
        'prt.token AS token',
      ])
      .where('u.email = :email', { email })
      .getRawOne();
      console.log('ASW:', passwordResetToken);

    const res = await request(app.getHttpServer())
      .post('/auth/password-reset')
      .send({ 
        token: passwordResetToken?.token,
        new_password: '12345678',
      });

    console.log('successfully post password reset response:', res.text);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed post password reset', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/password-reset')
      .send({ 
        token: 'invalid_token',
        password: '12345678',
      });

    console.log('failed post password reset response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
