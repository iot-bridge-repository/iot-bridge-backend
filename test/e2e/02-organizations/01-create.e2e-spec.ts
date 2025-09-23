import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { Organization } from 'src/common/entities';

describe('Organization Controller (e2e)', () => {
  let app: NestExpressApplication;
  const organizationName = "organization_test2";
  const regularUserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1MjQzYWM2LWFiMWItNDk4Yi04NDJmLWI1ZGZiODM0OTIzNiIsInJvbGUiOiJSZWd1bGFyIFVzZXIiLCJpYXQiOjE3NDc1NTI2NTZ9.f-UwNUVTnw2c2K9sv7K12wrobhIYqvmCeSNqw_MaQsk';
  const adminSystemToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1NTVmNmI1LWM3MjQtNDVhNi04N2NmLTk1Nzg2ZWIyYTAyMCIsInJvbGUiOiJBZG1pbiBTeXN0ZW0iLCJpYXQiOjE3NDY1MTQ3MTl9.NdUZTygW-nirskKvKgd_OloX7I9BAFYh3o2sWGxNVGE'

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

  // Post propose
  it('successfully post propose', async () => {
    const res = await request(app.getHttpServer())
      .post('/organizations/propose')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({
        name: organizationName
      })

    console.log('successfully post propose response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed post propose', async () => {
    const res = await request(app.getHttpServer())
      .post('/organizations/propose')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({
        name: organizationName
      })

    console.log('failed post propose response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Get search 
  it('successfully get search', async () => {
    const res = await request(app.getHttpServer())
      .get('/organizations/search?keyword=')
      .set('Authorization', `Bearer ${adminSystemToken}`)

    console.log('successfully get search response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed get search', async () => {
    const res = await request(app.getHttpServer())
      .get('/organizations/search?keyword=')
      .set('Authorization', `Bearer ${regularUserToken}`)

    console.log('failed get search response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Patch unverify
  it.only('successfully patch unverify', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: {id: true},
      where: { name: organizationName }, 
    });

    const res = await request(app.getHttpServer())
      .patch('/organizations/unverify')
      .set('Authorization', `Bearer ${adminSystemToken}`)
      .send({
        organization_id: organization?.id
      })

    console.log('successfully patch unverify response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it.only('failed patch unverify', async () => {
    const res = await request(app.getHttpServer())
      .patch('/organizations/unverify')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({
        organization_id: 'invalid_id'
      })

    console.log('failed patch unverify response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Patch verify
  it('successfully patch verify', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: {id: true},
      where: { name: organizationName }, 
    });

    const res = await request(app.getHttpServer())
      .patch('/organizations/verify')
      .set('Authorization', `Bearer ${adminSystemToken}`)
      .send({
        organization_id: organization?.id
      })

    console.log('successfully patch verify response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed patch verify', async () => {
    const res = await request(app.getHttpServer())
      .patch('/organizations/verify')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({
        organization_id: '123'
      })

    console.log('failed patch verify response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
