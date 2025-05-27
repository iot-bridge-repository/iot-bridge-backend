import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, MqttContext } from '@nestjs/microservices';
import { MqttService } from './mqtt.service';

@Controller()
export class MqttController {
  private readonly logger = new Logger(MqttController.name);
  constructor(
    private readonly mqttService: MqttService
  ) { }

  @MessagePattern('auth-code/+')
  async getDeviceData(@Payload() data: number[], @Ctx() context: MqttContext) {
    this.logger.log(`Received MQTT message on topic: ${context.getTopic()}`);

    const topic = context.getTopic();
    const topicParts = topic.split('/');
    const authCode = topicParts[1];
    if (!authCode) {
      this.logger.warn('Auth code is missing in the topic');
      return;
    }

    await this.mqttService.handleMqttMessage(authCode, data);
  }
}
