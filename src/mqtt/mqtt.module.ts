import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device, DeviceData, NotificationEvent, OrganizationMember, UserNotification } from '../common/entities';
import { MqttService } from './mqtt.service';
import { MqttController } from './mqtt.controller';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, DeviceData, NotificationEvent, OrganizationMember, UserNotification]),
    WebsocketModule
  ],
  controllers: [MqttController],
  providers: [MqttService],
})
export class MqttModule { }