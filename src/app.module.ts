import * as path from 'path';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthApiModule } from './auth-api/auth-api.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { OrganizationsApiModule } from './organizations-api/organizations-api.module';
import { NotificationsApiModule } from './notifications-api/notifications-api.module';
import { DevicesApiModule } from './devices-api/devices-api.module';
import { UsersApiModule } from './users-api/users-api.module';
import { MqttModule } from './mqtt/mqtt.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 10,
      max: 100,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: configService.get<string>('DB_TYPE') as 'aurora-mysql' | 'postgres' | 'mysql' | 'mariadb' | 'sqlite' | 'oracle' | 'aurora-postgres' | 'better-sqlite3' | 'cockroachdb' | 'sqljs' | 'mongodb' | 'mssql' | 'sap' | 'spanner' | 'cordova' | 'nativescript' | 'react-native' | 'expo' | 'ionics',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT') ?? 5432,
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          synchronize: false, 
          autoLoadEntities: true, 
          logging: true,
          logger: 'advanced-console',
          extra: {
            max: 10,
          }
        } as TypeOrmModuleOptions;
      },
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          rootPath: configService.get<string>('NODE_ENV') === 'production'
            ? '/var/www/uploads'
            : path.resolve(__dirname, '..', 'uploads'),
          serveRoot: '/uploads',
        },
      ],
    }),
    AuthApiModule,
    OrganizationsApiModule,
    NotificationsApiModule,
    DevicesApiModule,
    UsersApiModule,
    MqttModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
