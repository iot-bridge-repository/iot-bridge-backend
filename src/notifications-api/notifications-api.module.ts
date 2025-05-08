import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsApiService } from './notifications-api.service';
import { NotificationsApiController } from './notifications-api.controller';
import { AuthApiModule } from 'src/auth-api/auth-api.module';
import { UserNotification } from '../common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserNotification]),
    AuthApiModule
  ],
  controllers: [NotificationsApiController],
  providers: [NotificationsApiService],
})
export class NotificationsApiModule {}
