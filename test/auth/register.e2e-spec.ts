import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { VerifyEmailToken } from 'src/common/entities';

describe('Auth Controller (e2e)', () => {
  let app: NestExpressApplication;
  const email = 'test@example.com';
  const username = 'user_test';
  const phone_number = '081234567890';
  const password = '12345678';

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

  // Register
  it('successfully register', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username,
        email,
        phone_number,
        password,
      });

    console.log('successfully register response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed register', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username,
        email,
        phone_number,
        password,
      });

    console.log('failed register response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Login
  it('failed login', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identity: email,
        password,
      });

    console.log('failed login response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Verify email
  it('successfully verify email', async () => {
    const dataSource = app.get(DataSource);
    const verifyEmailToken = await dataSource.getRepository(VerifyEmailToken).findOne({
      select: {token: true},
      where: { email }, 
    });

    const res = await request(app.getHttpServer())
      .get(`/auth/verify-email/`)
      .query({ token: verifyEmailToken?.token });

    console.log('successfully verify email response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed verify email', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/verify-email')
      .query({ token: 'invalid_token' });

    console.log('failed verify email response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Login
  it('successfully login', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identity: email,
        password,
      });

    console.log('successfully login response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });
});
