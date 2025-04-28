import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationApiService } from './notification-api.service';
import { NotificationApiController } from './notification-api.controller';
import { AuthApiModule } from 'src/auth-api/auth-api.module';
import { UserNotification } from '../common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserNotification]),
    AuthApiModule
  ],
  controllers: [NotificationApiController],
  providers: [NotificationApiService],
})
export class NotificationApiModule {}
