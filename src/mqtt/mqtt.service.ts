import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from "uuid";
import { Device, DeviceData, NotificationEvent, ComparisonType, OrganizationMember, OrganizationMemberStatus, UserNotification } from '../common/entities';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class MqttService {
  private readonly logger = new Logger(MqttService.name);
  constructor(
    @InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
    @InjectRepository(DeviceData) private readonly deviceDataRepository: Repository<DeviceData>,
    @InjectRepository(NotificationEvent) private readonly notificationEventRepository: Repository<NotificationEvent>,
    @InjectRepository(OrganizationMember) private readonly organizationMemberRepository: Repository<OrganizationMember>,
    @InjectRepository(UserNotification) private readonly userNotificationRepository: Repository<UserNotification>,
    private readonly websocketGateway: WebsocketGateway,
  ) { }

  async handleMqttMessage(authCode: string, payload: any) {
    // Validate the authCode
    const device = await this.deviceRepository.findOne({
      select: { id: true, organization_id: true },
      where: { auth_code: authCode },
    });
    if (!device) {
      this.logger.warn(`There is no device with auth_code: ${authCode}`);
      return;
    }

    // Validate the payload
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      this.logger.warn(`Invalid payload type: expected object, got ${typeof payload}`);
      return;
    }

    // Save the device data
    const entries = Object.entries(payload);
    const data = entries.map(([pin, value]) => {
      return this.deviceDataRepository.create({
        device_id: device.id,
        pin,
        value: parseFloat(value as string),
        time: new Date(),
      });
    });
    this.deviceDataRepository.save(data);

    for (const [pin, value] of entries) {
      // Emit the data to the WebSocket server
      this.websocketGateway.emitDeviceData(device.id, pin, {
        value: value,
        time: new Date(),
      });
    }

    // Check for notification events
    for (const [pin, value] of entries) {
      await this.checkNotificationEvents(device.id, pin, parseFloat(value as string), device.organization_id);
    }
  }

  private async checkNotificationEvents(deviceId: string, pin: string, value: number, organizationId: string) {
    // Find active notification events for the device and pin
    const events = await this.notificationEventRepository.find({
      select: { subject: true, message: true, threshold_value: true, comparison_type: true },
      where: { device_id: deviceId, pin, is_active: true },
    });
    if (events.length === 0) return;

    // Check each event against the value
    for (const event of events) {
      const threshold = parseFloat(event.threshold_value as unknown as string);
      let shouldNotify = false;

      switch (event.comparison_type) {
        case ComparisonType.EQUAL:
          shouldNotify = value === threshold;
          break;
        case ComparisonType.NOT_EQUAL:
          shouldNotify = value !== threshold;
          break;
        case ComparisonType.GREATER:
          shouldNotify = value > threshold;
          break;
        case ComparisonType.LESSER:
          shouldNotify = value < threshold;
          break;
        case ComparisonType.GREATER_OR_EQUAL:
          shouldNotify = value >= threshold;
          break;
        case ComparisonType.LESSER_OR_EQUAL:
          shouldNotify = value <= threshold;
          break;
      }

      // If the condition is met, create a notification
      if (shouldNotify) {
        const memberId = await this.organizationMemberRepository.find({
          select: { user_id: true },
          where: { organization_id: organizationId, status: OrganizationMemberStatus.ACCEPTED },
        })
        const notifications = memberId.map(member => {
          return this.userNotificationRepository.create({
            id: uuidv4(),
            user_id: member.user_id,
            subject: event.subject,
            message: event.message,
            type: 'notification_event',
            created_at: new Date(),
          });
        });

        await this.userNotificationRepository.save(notifications);
      }
    }
  }
}
