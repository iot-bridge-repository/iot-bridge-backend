import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Otp, User } from '../entities';
import { AuthApiService } from './auth-api.service';
import { AuthApiController } from './auth-api.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Otp]),
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default_secret'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [AuthApiService],
  controllers: [AuthApiController]
})
export class AuthApiModule {}
