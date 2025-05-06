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
  const memberOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1NTVmNmI1LWM3MjQtNDVhNi04N2NmLTk1Nzg2ZWIyYTAyMCIsInJvbGUiOiJBZG1pbiBTeXN0ZW0iLCJpYXQiOjE3NDY1MTQ3MTl9.NdUZTygW-nirskKvKgd_OloX7I9BAFYh3o2sWGxNVGE';
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

  // Get member list
  it('successfully member list', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .get(`/organization/${organization?.id}/member-list`)
      .set('Authorization', `Bearer ${memberOrganizationToken}`)

    console.log('successfully member list response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  // Patch change member roles
  it('successfully patch change member roles', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .patch(`/organization/${organization?.id}/change-member-roles`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        user_id: memberId,
        new_role: "Operator"
      })

    console.log('successfully patch change member roles response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed patch change member roles', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .patch(`/organization/${organization?.id}/change-member-roles`)
      .set('Authorization', `Bearer ${memberOrganizationToken}`)
      .send({
        user_id: memberId,
        new_role: "Operator"
      })

    console.log('failed patch change member roles response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Delete member
  it('successfully delete member', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .delete(`/organization/${organization?.id}/member/${memberId}`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully delete member response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed delete member', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .delete(`/organization/${organization?.id}/member/${memberId}`)
      .set('Authorization', `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAzZDY1OTFmLWI4ZGEtNDMwNC1hNjVjLWRmMzI4NjZmMDg5ZiIsInJvbGUiOiJMb2thbCBNZW1iZXIiLCJpYXQiOjE3NDY1Mzg1NTB9.35EZ8E5Beu6JGE73wHL0t98Lu_5-Yb1LsFl-I-qjK90`)

    console.log('failed delete member response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Delete leave
  it.only('successfully delete leave', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .delete(`/organization/${organization?.id}/leave`)
      .set('Authorization', `Bearer ${memberOrganizationToken}`)

    console.log('successfully delete leave response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed delete leave', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .delete(`/organization/${organization?.id}/leave`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('failed delete leave response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
