import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, MqttContext } from '@nestjs/microservices';
import { MqttService } from './mqtt.service';

@Controller()
export class MqttController {
  private readonly logger = new Logger(MqttController.name);
  constructor(
    private readonly mqttService: MqttService
  ) { }

  @MessagePattern('device/auth-code/+')
  getDeviceData(@Payload() data: number[], @Ctx() context: MqttContext) {
    console.log(`Topic: ${context.getTopic()}`);
    console.log(data);

    const topic = context.getTopic();
    const topicParts = topic.split('/');
    const authCode = topicParts[2];

    this.mqttService.handleMqttMessage(authCode, data);
  }
}
