import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { Organization, Device, WidgetBox } from 'src/common/entities';

describe('Device Controller (e2e)', () => {
  let app: NestExpressApplication;
  const organizationName = "organization_test2";
  const deviceName = "Device test organization_test2";
  const adminOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1MjQzYWM2LWFiMWItNDk4Yi04NDJmLWI1ZGZiODM0OTIzNiIsInJvbGUiOiJSZWd1bGFyIFVzZXIiLCJpYXQiOjE3NDc1NTI2NTZ9.f-UwNUVTnw2c2K9sv7K12wrobhIYqvmCeSNqw_MaQsk';
  const nonMemberOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI1ZDM1NTk1LWZkOGMtNGYzZi1hZDkzLTAyM2E3Yzc5OWJkNCIsInJvbGUiOiJSZWd1bGFyIFVzZXIiLCJpYXQiOjE3NDc1NTYyMDR9.6CqphO9VNASFn_GW55FQxogQh-E_Fx8926sWadootFY';

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

  // Create or update widget boxes
  it('successfully create or update widget boxes', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });

    const res = await request(app.getHttpServer())
      .put(`/organizations/${organization?.id}/devices/${device?.id}/widget-boxes`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        name: 'suhu 2',
        pin: 'A1',
      })

    console.log('successfully create or update widget boxes response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed create or update widget boxes', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });

    const res = await request(app.getHttpServer())
      .put(`/organizations/${organization?.id}/devices/${device?.id}/widget-boxes`)
      .set('Authorization', `Bearer ${nonMemberOrganizationToken}`)
      .send({
        name: 'suhu 2',
        pin: 'A1',
      })

    console.log('failed create or update widget boxes response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Get widget boxes list
  it('successfully get widget boxes list', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });

    const res = await request(app.getHttpServer())
      .get(`/organizations/${organization?.id}/devices/${device?.id}/widget-boxes/list`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully get widget boxes list response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed get widget boxes list', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });

    const res = await request(app.getHttpServer())
      .get(`/organizations/${organization?.id}/devices/${device?.id}/widget-boxes/list`)
      .set('Authorization', `Bearer ${nonMemberOrganizationToken}`)

    console.log('failed get widget boxes list response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Get widget boxes
  it('successfully get widget boxes by id', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });
    const widgetBox = await dataSource.getRepository(WidgetBox).findOne({
      select: { id: true },
      where: { device_id: device?.id },
    })

    const res = await request(app.getHttpServer())
      .get(`/organizations/${organization?.id}/devices/${device?.id}/widget-boxes/${widgetBox?.id}`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully get widget boxes by id response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed get widget boxes by id', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });
    const widgetBox = await dataSource.getRepository(WidgetBox).findOne({
      select: { id: true },
      where: { device_id: device?.id },
    })

    const res = await request(app.getHttpServer())
      .get(`/organizations/${organization?.id}/devices/${device?.id}/widget-boxes/${widgetBox?.id}`)
      .set('Authorization', `Bearer ${nonMemberOrganizationToken}`)

    console.log('failed get widget boxes by id response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Delete widget boxes
  it('successfully delete widget boxes', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });
    const widgetBox = await dataSource.getRepository(WidgetBox).findOne({
      select: { id: true },
      where: { device_id: device?.id },
    })

    const res = await request(app.getHttpServer())
      .delete(`/organizations/${organization?.id}/devices/${device?.id}/widget-boxes/${widgetBox?.id}`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully delete widget boxes response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed delete widget boxes', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });
    const widgetBox = await dataSource.getRepository(WidgetBox).findOne({
      select: { id: true },
      where: { device_id: device?.id },
    })

    const res = await request(app.getHttpServer())
      .delete(`/organizations/${organization?.id}/devices/${device?.id}/widget-boxes/${widgetBox?.id}`)
      .set('Authorization', `Bearer ${nonMemberOrganizationToken}`)

    console.log('failed delete widget boxes response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
