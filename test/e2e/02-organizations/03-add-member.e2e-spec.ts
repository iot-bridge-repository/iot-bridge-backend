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
  const adminOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1MjQzYWM2LWFiMWItNDk4Yi04NDJmLWI1ZGZiODM0OTIzNiIsInJvbGUiOiJSZWd1bGFyIFVzZXIiLCJpYXQiOjE3NDc1NTI2NTZ9.f-UwNUVTnw2c2K9sv7K12wrobhIYqvmCeSNqw_MaQsk';
  const memberId = '25d35595-fd8c-4f3f-ad93-023a7c799bd4'
  const memberOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI1ZDM1NTk1LWZkOGMtNGYzZi1hZDkzLTAyM2E3Yzc5OWJkNCIsInJvbGUiOiJSZWd1bGFyIFVzZXIiLCJpYXQiOjE3NDc1NTYyMDR9.6CqphO9VNASFn_GW55FQxogQh-E_Fx8926sWadootFY';

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
    expect(res.body.message).toBeDefined();
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
    expect(res.body.message).toBeDefined();
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
    expect(res.body.message).toBeDefined();
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
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Post create local member
  it('successfully post create local member', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .post(`/organizations/${organization?.id}/local-member`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        username: "localMemberTest2",
        password: "12345678"
      })

    console.log('successfully post create local member response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed post create local member', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .post(`/organizations/${organization?.id}/local-member`)
      .set('Authorization', `Bearer ${memberOrganizationToken}`)
      .send({
        username: "userLocalMemberTest",
        password: "12345678"
      })

    console.log('failed post create local member response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
