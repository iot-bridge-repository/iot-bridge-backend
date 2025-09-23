import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { Organization, Device, NotificationEvent } from 'src/common/entities';

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

  // Create notification events
  it('successfully create notification events', async () => {
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
      .post(`/organizations/${organization?.id}/devices/${device?.id}/notification-events`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        pin: 'V1',
        subject: 'suhu telalu panas',
        message: 'suhu telalu panas, nyalakan penyiraman',
        comparison_type: '>',
        threshold_value: '50',
        is_active: true
      })

    console.log('successfully create notification events response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed create notification events', async () => {
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
      .post(`/organizations/${organization?.id}/devices/${device?.id}/notification-events`)
      .set('Authorization', `Bearer ${nonMemberOrganizationToken}`)
      .send({
        pin: 'V1',
        subject: 'suhu telalu panas',
        message: 'suhu telalu panas, nyalakan penyiraman',
        comparison_type: '>',
        threshold_value: '50',
        is_active: true
      })

    console.log('failed create notification events response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Get notification events list
  it('successfully get notification events list', async () => {
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
      .get(`/organizations/${organization?.id}/devices/${device?.id}/notification-events/list`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully get notification events list response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed get notification events list', async () => {
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
      .get(`/organizations/${organization?.id}/devices/${device?.id}/notification-events/list`)
      .set('Authorization', `Bearer ${nonMemberOrganizationToken}`)

    console.log('failed get notification events list response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Get notification events
  it('successfully get notification events ', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });
    const notificationEvent = await dataSource.getRepository(NotificationEvent).findOne({
      select: { id: true },
      where: { device_id: device?.id },
    })

    const res = await request(app.getHttpServer())
      .get(`/organizations/${organization?.id}/devices/${device?.id}/notification-events/${notificationEvent?.id}`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully get notification events response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed get notification events ', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });
    const notificationEvent = await dataSource.getRepository(NotificationEvent).findOne({
      select: { id: true },
      where: { device_id: device?.id },
    })

    const res = await request(app.getHttpServer())
      .get(`/organizations/${organization?.id}/devices/${device?.id}/notification-events/${notificationEvent?.id}`)
      .set('Authorization', `Bearer ${nonMemberOrganizationToken}`)

    console.log('failed get notification events response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Update notification events
  it('successfully update notification events', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });
    const notificationEvent = await dataSource.getRepository(NotificationEvent).findOne({
      select: { id: true },
      where: { device_id: device?.id },
    })

    const res = await request(app.getHttpServer())
      .patch(`/organizations/${organization?.id}/devices/${device?.id}/notification-events/${notificationEvent?.id}`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        pin: 'V1',
        subject: 'suhu telalu panas',
        message: 'suhu telalu panas, nyalakan penyiraman',
        comparison_type: '>',
        threshold_value: '100',
        is_active: true
      })

    console.log('successfully update notification events response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed update notification events', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });
    const notificationEvent = await dataSource.getRepository(NotificationEvent).findOne({
      select: { id: true },
      where: { device_id: device?.id },
    })

    const res = await request(app.getHttpServer())
      .patch(`/organizations/${organization?.id}/devices/${device?.id}/notification-events/${notificationEvent?.id}`)
      .set('Authorization', `Bearer ${nonMemberOrganizationToken}`)
      .send({
        pin: 'V1',
        subject: 'suhu telalu panas',
        message: 'suhu telalu panas, nyalakan penyiraman',
        comparison_type: '>',
        threshold_value: '100',
        is_active: true
      })

    console.log('failed update notification events response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Delete notification events
  it('successfully delete notification events', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });
    const notificationEvent = await dataSource.getRepository(NotificationEvent).findOne({
      select: { id: true },
      where: { device_id: device?.id },
    })

    const res = await request(app.getHttpServer())
      .delete(`/organizations/${organization?.id}/devices/${device?.id}/notification-events/${notificationEvent?.id}`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully delete notification events response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed delete notification events', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName, organization_id: organization?.id },
    });
    const notificationEvent = await dataSource.getRepository(NotificationEvent).findOne({
      select: { id: true },
      where: { device_id: device?.id },
    })

    const res = await request(app.getHttpServer())
      .delete(`/organizations/${organization?.id}/devices/false-devices-id/notification-events/${notificationEvent?.id}`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('failed delete notification events response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
