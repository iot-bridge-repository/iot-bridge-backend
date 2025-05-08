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
  const organizationName = "organization_test 2";
  const adminOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI4NjVkMDhhLTEyNmMtNDQ4Mi05YTU2LTBkY2Q0ODQyMWY2MyIsInJvbGUiOiJSZWd1bGFyIFVzZXIiLCJpYXQiOjE3NDY1MDEzNTR9.2N8RHoejnxr6JI1c9SQhQm2oEl8mYuu6fuQCjVptTo4';
  const memberOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1NTVmNmI1LWM3MjQtNDVhNi04N2NmLTk1Nzg2ZWIyYTAyMCIsInJvbGUiOiJBZG1pbiBTeXN0ZW0iLCJpYXQiOjE3NDY1MTQ3MTl9.NdUZTygW-nirskKvKgd_OloX7I9BAFYh3o2sWGxNVGE'
  const memberId = '0555f6b5-c724-45a6-87cf-95786eb2a020'

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

  // Get search users
  it('successfully search users', async () => {
    const res = await request(app.getHttpServer())
      .get(`/organizations/users`)
      .query({ identity: 'user' })
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully search users response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  // Post member invitation
  it('successfully post member invitation', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .post(`/organizations/${organization?.id}/member-invitation`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        user_id: memberId,
      })

    console.log('successfully post member invitation response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed post member invitation', async () => {
    const res = await request(app.getHttpServer())
      .post(`/organizations/invalid_organization_id/member-invitation`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        user_id: memberId,
      })

    console.log('failed post member invitation response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Patch invitation response
  it('successfully patch invitation response', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .patch(`/organizations/${organization?.id}/member-invitation-response`)
      .set('Authorization', `Bearer ${memberOrganizationToken}`)
      .send({
        is_accepted: true,
      })

    console.log('successfully patch invitation response response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed patch invitation response', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/organizations/invalid_organization_id/member-invitation-response`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        is_accepted: false,
      })

    console.log('failed patch invitation response response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Post create lokal member
  it('successfully post create lokal member', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .post(`/organizations/${organization?.id}/lokal-member`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        username: "lokalMemberTest2",
        password: "12345678"
      })

    console.log('successfully post create lokal member response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it.only('failed post create lokal member', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .post(`/organizations/${organization?.id}/lokal-member`)
      .set('Authorization', `Bearer ${memberOrganizationToken}`)
      .send({
        username: "userLokalMemberTest",
        password: "12345678"
      })

    console.log('failed post create lokal member response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
