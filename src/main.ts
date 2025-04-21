import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // Middleware untuk mengamankan HTTP headers
  app.use(helmet());

  // Konfigurasi Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('IoT Bridge API Documentation')
      .setDescription('API Documentation for IoT Bridge Application')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      customSiteTitle: "IoT Bridge API Documentation",
    });
    logger.log('📄 Swagger API Docs are available at: http://localhost:3000/api-docs');
  }

  // Konfigurasi pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Hanya menerima properti yang ada di DTO
      forbidNonWhitelisted: true, // Tolak request dengan properti yang tidak ada di DTO
      transform: true, // Otomatis mengubah request menjadi instance DTO
    }),
  );

  // Konfigurasi filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Konfigurasi hbs
  app.setBaseViewsDir(join(__dirname, '..', 'src', 'common', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Application is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
