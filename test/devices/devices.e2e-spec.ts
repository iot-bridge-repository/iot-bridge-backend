import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { Organization, Device } from 'src/common/entities';

describe('Device Controller (e2e)', () => {
  let app: NestExpressApplication;
  const organizationName = "organization_test";
  const deviceName = "Device test 3";
  const adminOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI4NjVkMDhhLTEyNmMtNDQ4Mi05YTU2LTBkY2Q0ODQyMWY2MyIsInJvbGUiOiJSZWd1bGFyIFVzZXIiLCJpYXQiOjE3NDY1MDEzNTR9.2N8RHoejnxr6JI1c9SQhQm2oEl8mYuu6fuQCjVptTo4';
  const nonMemberOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFhZjM0YWVmLTAwZTItNDYzMC04OTE4LWI0NDFiM2VlZTg0NyIsInJvbGUiOiJBZG1pbiBTeXN0ZW0iLCJpYXQiOjE3NDY3NzA5NTd9.UVlK5V-H4ZwsQovVIUD-TFkvkoiwQeNUOoDmfLc86x4';

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

  // Create device
  it('successfully create device', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .post(`/organizations/${organization?.id}/devices`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        name: deviceName,
      })

    console.log('successfully create device response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed create device', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .post(`/organizations/${organization?.id}/devices`)
      .set('Authorization', `Bearer ${nonMemberOrganizationToken}}`)
      .send({
        name: deviceName,
      })

    console.log('failed create device response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Get devices search
  it('successfully get devices search', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });

    const res = await request(app.getHttpServer())
      .get(`/organizations/${organization?.id}/devices/search?name=`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully get devices search response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  // Get devices
  it('successfully get devices', async () => {
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
      .get(`/organizations/${organization?.id}/devices/${device?.id}`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully get devices response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  // Update device
  it('successfully update device', async () => {
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
      .patch(`/organizations/${organization?.id}/devices/${device?.id}`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        name: `${deviceName} updated`,
      })

    console.log('successfully update device response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  it('failed update device', async () => {
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
      .patch(`/organizations/${organization?.id}/devices/${device?.id}`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
      .send({
        name: `${deviceName} updated`,
      })

    console.log('failed update device response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Delete device
  it('successfully delete device', async () => {
    const dataSource = app.get(DataSource);
    const organization = await dataSource.getRepository(Organization).findOne({
      select: { id: true },
      where: { name: organizationName },
    });
    const device = await dataSource.getRepository(Device).findOne({
      select: { id: true },
      where: { name: deviceName + ' updated', organization_id: organization?.id },
    });

    const res = await request(app.getHttpServer())
      .delete(`/organizations/${organization?.id}/devices/${device?.id}`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)

    console.log('successfully delete device response:', res.body);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });
});
