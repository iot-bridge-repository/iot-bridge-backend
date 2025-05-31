import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // Microservice configuration for MQTT
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: process.env.MQTT_BROKER_URL,
      username: process.env.MQTT_BROKER_USERNAME,
      password: process.env.MQTT_BROKER_PASSWORD,
    },
  });

  // Middleware for security
  app.use(helmet());

  // Swagger configuration
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

  // hbs configuration
  app.setBaseViewsDir(join(__dirname, '..', 'src', 'common', 'views'));
  app.setViewEngine('hbs');

  // Start microservice
  await app.startAllMicroservices();
  logger.log('✅ Microservice started');

  // CORS configuration
  app.enableCors();

  // Start HTTP server
  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Application is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
