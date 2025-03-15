import * as path from 'path';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthApiModule } from './auth-api/auth-api.module';
import { LoggingMiddleware } from './middleware/logging.middleware';

@Module({
  imports: [
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
          entities: [__dirname + '/entities/*.entity{.ts,.js}'],
          synchronize: false, 
          autoLoadEntities: true, 
          logging: true,
          logger: 'advanced-console',
        } as TypeOrmModuleOptions;
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: process.env.NODE_ENV === 'production'
        ? '/var/www/uploads'
        : path.join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthApiModule
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
