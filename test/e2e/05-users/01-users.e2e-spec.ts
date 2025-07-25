import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import helmet from 'helmet';
import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';

describe('Device Controller (e2e)', () => {
  let app: NestExpressApplication;
  const adminSystemToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1NTVmNmI1LWM3MjQtNDVhNi04N2NmLTk1Nzg2ZWIyYTAyMCIsInJvbGUiOiJBZG1pbiBTeXN0ZW0iLCJpYXQiOjE3NDY5NDU5NjJ9.Kzb7szg3rNmzX-UtBsxO02_9K1BcrbnLuPQtKP4Aj6I';
  const regularUserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1MjQzYWM2LWFiMWItNDk4Yi04NDJmLWI1ZGZiODM0OTIzNiIsInJvbGUiOiJSZWd1bGFyIFVzZXIiLCJpYXQiOjE3NDc1NTI2NTZ9.f-UwNUVTnw2c2K9sv7K12wrobhIYqvmCeSNqw_MaQsk';
  const localMemberToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU1YjkxZGM5LWI1ZDAtNGJmNy1iYmJhLWQ3Yjg3Mjc0NGVjNyIsInJvbGUiOiJMb2thbCBNZW1iZXIiLCJpYXQiOjE3NDc1NjAyODZ9.5cbRObBonOyiNS9e2M0KMc0e88bvZ2Dha8e9iIkDCyQ';

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

  // Get users by id
  it('successfully get users by id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/da50de59-1f67-4007-ab33-3de8d08825b9`)
      .set('Authorization', `Bearer ${adminSystemToken}`)

    console.log('successfully get users by id response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed get users by id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/da50de59-1f67-4007-ab33-3de8d08825b9`)
      .set('Authorization', `Bearer ${regularUserToken}`)

    console.log('failed get users by id response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Get users search
  it('successfully get users search', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/search?identity=`)
      .set('Authorization', `Bearer ${adminSystemToken}`)

    console.log('successfully get users search response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed get users search', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/search?identity=`)
      .set('Authorization', `Bearer ${localMemberToken}`)

    console.log('failed get users search response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
