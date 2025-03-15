import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filter/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Konfigurasi Swagger
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  if (env !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('IoT Bridge API Documentation')
      .setDescription('API Documentation for IoT Bridge Application')
      .setVersion('1.0')
      .addTag('Auth')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
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

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Application is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
