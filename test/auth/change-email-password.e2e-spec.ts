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

describe('AuthController (e2e)', () => {
  let app: NestExpressApplication;
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI4NjVkMDhhLTEyNmMtNDQ4Mi05YTU2LTBkY2Q0ODQyMWY2MyIsInJvbGUiOiJSZWd1bGFyIFVzZXIiLCJpYXQiOjE3NDY1MDEzNTR9.2N8RHoejnxr6JI1c9SQhQm2oEl8mYuu6fuQCjVptTo4';
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

  // Change email 
  it('successfully change email', async () => {
    const res = await request(app.getHttpServer())
      .patch('/auth/email')
      .set('Authorization', `Bearer ${token}`)
      .send({
        new_email: email,
      })

    console.log('successfully change email response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed change email', async () => {
    const res = await request(app.getHttpServer())
      .patch('/auth/email')
      .set('Authorization', `Bearer ${token}`)
      .send({
        new_email: email,
      })

    console.log('failed change email response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Verify email
  it('successfully verify email', async () => {
    const dataSource = app.get(DataSource);
    const verifyEmailToken = await dataSource.getRepository(VerifyEmailToken).findOne({
      select: { token: true },
      where: { email },
    });

    const res = await request(app.getHttpServer())
      .get(`/auth/verify-email/`)
      .query({ token: verifyEmailToken?.token });

    console.log('successfully verify email response:', res.text);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  // Change password
  it('successfully change password', async () => {
    const res = await request(app.getHttpServer())
      .patch('/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        old_password: "12345678",
        new_password: "12345678"
      })

    console.log('successfully change password response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed change password', async () => {
    const res = await request(app.getHttpServer())
      .patch('/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        old_password: "123456789",
        new_password: "12345678"
      })

    console.log('failed change password response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

});
