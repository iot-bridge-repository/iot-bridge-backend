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

describe('OrganizationController (e2e)', () => {
  let app: NestExpressApplication;
  const organizationName = "organization_test";
  const adminOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI4NjVkMDhhLTEyNmMtNDQ4Mi05YTU2LTBkY2Q0ODQyMWY2MyIsInJvbGUiOiJSZWd1bGFyIFVzZXIiLCJpYXQiOjE3NDY1MDEzNTR9.2N8RHoejnxr6JI1c9SQhQm2oEl8mYuu6fuQCjVptTo4';
  const nonMemberOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1NTVmNmI1LWM3MjQtNDVhNi04N2NmLTk1Nzg2ZWIyYTAyMCIsInJvbGUiOiJBZG1pbiBTeXN0ZW0iLCJpYXQiOjE3NDY1MTQ3MTl9.NdUZTygW-nirskKvKgd_OloX7I9BAFYh3o2sWGxNVGE'

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

  // Get profile
  it('successfully get profile', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .get(`/organization/${organization?.id}/profile`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully patch unverify response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed get profile', async () => {
    const res = await request(app.getHttpServer())
      .get(`/organization/invalid_id/profile`)
      .set('Authorization', `Bearer ${nonMemberOrganizationToken}`)

    console.log('failed patch unverify response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Patch profile
  it('successfully patch profile', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .patch(`/organization/${organization?.id}/profile`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        name: organizationName,
        description: 'This is a description of the organization',
      })

    console.log('successfully patch profile response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it.only('failed patch profile', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .patch(`/organization/${organization?.id}/profile`)
      .set('Authorization', `Bearer ${nonMemberOrganizationToken}`)
      .send({
        name: organizationName,
        description: 'This is a description of the organization',
      })

    console.log('failed patch profile response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
