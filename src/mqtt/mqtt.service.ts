import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from "uuid";
import { Device, DeviceData, NotificationEvent, ComparisonType, OrganizationMember, OrganizationMemberStatus, UserNotification } from '../common/entities';
import { WebsocketService } from '../websocket/websocket.service';
import { FcmService } from '../common/services/fcm.service';

@Injectable()
export class MqttService {
  private readonly logger = new Logger(MqttService.name);
  private readonly fcmService: FcmService;
  constructor(
    @InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
    @InjectRepository(DeviceData) private readonly deviceDataRepository: Repository<DeviceData>,
    @InjectRepository(NotificationEvent) private readonly notificationEventRepository: Repository<NotificationEvent>,
    @InjectRepository(OrganizationMember) private readonly organizationMemberRepository: Repository<OrganizationMember>,
    @InjectRepository(UserNotification) private readonly userNotificationRepository: Repository<UserNotification>,
    private readonly websocketService: WebsocketService,
    private readonly configService: ConfigService,
  ) {
    this.fcmService = new FcmService(this.configService);
  }

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

    // Emit the device pin data
    for (const [pin, value] of entries) {
      this.websocketService.emitDevicePinData(device.id, pin, {
        value: parseFloat(value as string),
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
      select: { threshold_value: true, comparison_type: true, last_triggered: true, subject: true, message: true, id: true, last_triggered_at: true },
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

      const currentTriggered = shouldNotify;
      const previouslyTriggered = event.last_triggered;
      // Send notification if the event is triggered and was not previously triggered
      if (currentTriggered && !previouslyTriggered) {
        const memberId = await this.organizationMemberRepository.find({
          select: { user_id: true },
          where: { organization_id: organizationId, status: OrganizationMemberStatus.ACCEPTED },
        });
        const notifications = memberId.map(member =>
          this.userNotificationRepository.create({
            id: uuidv4(),
            user_id: member.user_id,
            subject: event.subject,
            message: event.message,
            type: 'notification_event',
            created_at: new Date(),
          }),
        );
        await this.userNotificationRepository.save(notifications);

        // Send mobile notification
        for (const member of memberId) {
          await this.fcmService.sendMobileNotification(member.user_id, event.subject, event.message, { deviceId, pin, value: value.toString() });
        }
      }

      // Update last_triggered status in the event
      if (currentTriggered !== previouslyTriggered) {
        await this.notificationEventRepository.update(event.id, {
          last_triggered: currentTriggered,
          last_triggered_at: currentTriggered ? new Date() : event.last_triggered_at,
        });
      }
    }
  }
}
