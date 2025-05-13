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
  const deviceName = "Device test";
  const adminOrganizationToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjllZWEzMzhkLTJkMDYtNGFhYy04MmMwLTE0ZDU1OThhZTgyZiIsInJvbGUiOiJSZWd1bGFyIFVzZXIiLCJpYXQiOjE3NDcwOTQ2NTF9.z1IlqHFIVPh0cfnzfQyHpuVfPZcbWr_ttM9fjZr9YBw';

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

  // Get devices report
  it('successfully get devices report', async () => {
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
      .get(`/organizations/${organization?.id}/devices/${device?.id}/report?pin=V2&start=2025-01-01&end=2025-10-08`)
      .set('Authorization', `Bearer ${adminOrganizationToken}`)
  
    console.log('successfully get devices report response:', res.body);
    expect(res.body.message).toBeDefined();
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });
});
