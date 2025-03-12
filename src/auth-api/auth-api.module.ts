import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { AuthApiService } from './auth-api.service';
import { AuthApiController } from './auth-api.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'secret_key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthApiService],
  controllers: [AuthApiController]
})
export class AuthApiModule {}
