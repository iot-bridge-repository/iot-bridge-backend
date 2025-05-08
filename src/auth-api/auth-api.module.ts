import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { User, VerifyEmailToken, ResetPasswordToken } from '../common/entities';
import { AuthApiService } from './auth-api.service';
import { AuthApiController } from './auth-api.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, VerifyEmailToken, ResetPasswordToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default_secret'),
      }),
    }),
  ],
  providers: [AuthApiService],
  controllers: [AuthApiController],
  exports: [JwtModule],
})
export class AuthApiModule {}
