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
  const organizationName = "organization_test";
  const adminOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjllZWEzMzhkLTJkMDYtNGFhYy04MmMwLTE0ZDU1OThhZTgyZiIsInJvbGUiOiJSZWd1bGFyIFVzZXIiLCJpYXQiOjE3NDcwOTQ2NTF9.z1IlqHFIVPh0cfnzfQyHpuVfPZcbWr_ttM9fjZr9YBw';
  const memberOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRhNTBkZTU5LTFmNjctNDAwNy1hYjMzLTNkZThkMDg4MjViOSIsInJvbGUiOiJSZWd1bGFyIFVzZXIiLCJpYXQiOjE3NDcxMDcwNDl9.XmmiIsWudyy8zlRTFjqS03KeCu-__GwKCjriaKn35WI';
  const memberId = 'da50de59-1f67-4007-ab33-3de8d08825b9'

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
      .get(`/organizations/${organization?.id}/member-list`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully member list response:', res.body);
    expect(res.body.message).toBeDefined();
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
      .patch(`/organizations/${organization?.id}/member-roles`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        user_id: memberId,
        new_role: "Operator"
      })

    console.log('successfully patch change member roles response:', res.body);
    expect(res.body.message).toBeDefined();
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
      .patch(`/organizations/${organization?.id}/member-roles`)
      .set('Authorization', `Bearer ${memberOrganizationToken}`)
      .send({
        user_id: memberId,
        new_role: "Operator"
      })

    console.log('failed patch change member roles response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Delete member
  it.only('successfully delete member', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .delete(`/organizations/${organization?.id}/member/4ea128a1-c13e-4077-a018-9c186e681670`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully delete member response:', res.body);
    expect(res.body.message).toBeDefined();
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
      .delete(`/organizations/${organization?.id}/member/${memberId}`)
      .set('Authorization', `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAzZDY1OTFmLWI4ZGEtNDMwNC1hNjVjLWRmMzI4NjZmMDg5ZiIsInJvbGUiOiJMb2thbCBNZW1iZXIiLCJpYXQiOjE3NDY1Mzg1NTB9.35EZ8E5Beu6JGE73wHL0t98Lu_5-Yb1LsFl-I-qjK90`)

    console.log('failed delete member response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Delete leave
  it('successfully delete leave', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .delete(`/organizations/${organization?.id}/leave`)
      .set('Authorization', `Bearer ${memberOrganizationToken}`)

    console.log('successfully delete leave response:', res.body);
    expect(res.body.message).toBeDefined();
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
      .delete(`/organizations/${organization?.id}/leave`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('failed delete leave response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
