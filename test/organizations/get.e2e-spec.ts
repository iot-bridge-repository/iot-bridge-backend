import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import helmet from 'helmet';
import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';

describe('Organization Controller (e2e)', () => {
  let app: NestExpressApplication;
  const adminSystemToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1NTVmNmI1LWM3MjQtNDVhNi04N2NmLTk1Nzg2ZWIyYTAyMCIsInJvbGUiOiJBZG1pbiBTeXN0ZW0iLCJpYXQiOjE3NDY5NDU5NjJ9.Kzb7szg3rNmzX-UtBsxO02_9K1BcrbnLuPQtKP4Aj6I';

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

  // Get organizations search
  it('successfully get organizations search', async () => {
    const res = await request(app.getHttpServer())
      .get(`/organizations/search?keyword=Lampung`)
      .set('Authorization', `Bearer ${adminSystemToken}`)

    console.log('successfully get organizations search response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  // Get organizations by id
  it('successfully get organizations by id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/organizations/e8311a6f-bbd4-4924-931d-8b601a09a517`)
      .set('Authorization', `Bearer ${adminSystemToken}`)

    console.log('successfully get organizations by id response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

});
