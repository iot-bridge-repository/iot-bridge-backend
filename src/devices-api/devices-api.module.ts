import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesApiService } from './devices-api.service';
import { DevicesApiController } from './devices-api.controller';
import { AuthApiModule } from 'src/auth-api/auth-api.module';
import { Organization, OrganizationMember, Device, WidgetBox, DeviceData, NotificationEvent } from '../common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationMember, Device, WidgetBox, DeviceData, NotificationEvent]),
    AuthApiModule
  ],
  controllers: [DevicesApiController],
  providers: [DevicesApiService],
})
export class DevicesApiModule {}
