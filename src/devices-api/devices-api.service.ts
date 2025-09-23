import { Injectable, Logger, HttpException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere, Between } from 'typeorm';
import { v4 as uuidv4 } from "uuid";
import * as dto from './dto';
import { Device, WidgetBox, DeviceData, NotificationEvent } from '../common/entities';

@Injectable()
export class DevicesApiService {
  private readonly logger = new Logger(DevicesApiService.name);
  constructor(
    @InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
    @InjectRepository(WidgetBox) private readonly widgetBoxRepository: Repository<WidgetBox>,
    @InjectRepository(DeviceData) private readonly deviceDataRepository: Repository<DeviceData>,
    @InjectRepository(NotificationEvent) private readonly notificationEventRepository: Repository<NotificationEvent>,
  ) { }

  private async checkDeviceandOrganizationId(organizationId: string, deviceId: string) {
    const device = await this.deviceRepository.findOne({
      select: { id: true },
      where: { id: deviceId, organization_id: organizationId, },
    });
    if (!device) {
      this.logger.warn(`Failed to check device and organization id, Device with id: ${deviceId} does not exist in organization with id: ${organizationId}`);
      throw new BadRequestException(`Device with id: ${deviceId} does not exist in this organization`);
    }
  }

  async post(organizationId: string, postDto: dto.PostDto) {
    try {
      const existingDevice = await this.deviceRepository.findOne({
        select: { id: true },
        where: {
          name: postDto.name,
          organization_id: organizationId
        }
      })
      if (existingDevice) {
        this.logger.warn(`Failed to create device. Device with name: ${postDto.name} already exists in organization with id: ${organizationId}`);
        throw new BadRequestException(`Device with name: ${postDto.name} already exists in this organization`);
      }

      const newDevice = this.deviceRepository.create({
        id: uuidv4(),
        organization_id: organizationId,
        name: postDto.name,
        auth_code: uuidv4(),
      })
      await this.deviceRepository.save(newDevice);

      this.logger.log(`Success to create device. Device with name: ${postDto.name} created in organization with id: ${organizationId}`);
      return {
        message: "Device created successfully.",
        data: newDevice
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to create device with name: ${postDto.name} in organization with id: ${organizationId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to create device, please try again later');
    }
  }

  async getSearch(organizationId: string, name: string) {
    try {
      const where: FindOptionsWhere<Device> = {
        organization_id: organizationId,
      };
      if (name) {
        where.name = ILike(`%${name}%`);
      }
      const devices = await this.deviceRepository.find({
        select: { id: true, name: true, auth_code: true, },
        where,
      });

      this.logger.log(`Success to get search organization device. Successfully retrieved organization device by name: ${name}`);
      return {
        message: 'List of organization device.',
        data: devices,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Success to get search organization device, Error: ${error.message}`);
      throw new InternalServerErrorException('Success to get search organization device, please try again later');
    }
  }

  async get(organizationId: string, deviceId: string) {
    try {
      const devices = await this.deviceRepository.findOne({
        select: { id: true, name: true, auth_code: true },
        where: { organization_id: organizationId, id: deviceId }
      });

      this.logger.log(`Success to get device by id. Get device with id: ${deviceId} in organization with id: ${organizationId}`);
      return {
        message: 'Device details.',
        data: devices,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get device by id, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get device by id, please try again later');
    }
  }

  async patch(organizationId: string, deviceId: string, postDto: dto.PostDto) {
    try {
      const existingDevice = await this.deviceRepository.findOne({
        select: { id: true },
        where: {
          name: postDto.name,
          organization_id: organizationId
        }
      })
      if (existingDevice) {
        this.logger.warn(`Failed to update device. Device with name: ${postDto.name} already exists in organization with id: ${organizationId}`);
        throw new BadRequestException(`Device with name: ${postDto.name} already exists in this organization`);
      }

      await this.deviceRepository.update(deviceId, { name: postDto.name });

      this.logger.log(`Success to update device. Device updated in organization with id: ${organizationId}`);
      return {
        message: "Device updated successfully.",
        data: { id: deviceId, name: postDto.name }
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to update device in organization with id: ${organizationId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to update device, please try again later');
    }
  }

  async delete(deviceId: string) {
    try {
      await this.deviceRepository.delete(deviceId);

      this.logger.log(`Success to delete device. Successfully deleted device with id: ${deviceId}`);
      return {
        message: "Device deleted successfully.",
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to delete device with id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete device, please try again later');
    }
  }

    async getPinList(deviceId: string) {
    try {
      const pins = await this.deviceDataRepository
        .createQueryBuilder('device_data')
        .select('DISTINCT device_data.pin', 'pin')
        .where('device_data.device_id = :deviceId', { deviceId })
        .getRawMany();
      const pinList = pins.map(item => item.pin);

      this.logger.log(`Success to get pin list. Successfully retrieved pin list with device id: ${deviceId}`);
      return {
        message: 'Pin list.',
        data: pinList,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get pin list with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get pin list, please try again later');
    }
  }

  async putWidgetBox(organizationId: string, deviceId: string, putWidgetBoxDto: dto.PutWidgetBoxDto) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      let widgetBoxId = putWidgetBoxDto.id;
      if (widgetBoxId) {
        // Check id
        const existingWidgetBox = await this.widgetBoxRepository.findOne({
          select: { id: true },
          where: { id: widgetBoxId, device_id: deviceId },
        });
        if (!existingWidgetBox) {
          this.logger.warn(`Failed to update or create widget box. Widget box with id: ${widgetBoxId} does not exist in device with id: ${deviceId}`);
          throw new BadRequestException(`Widget box with id: ${widgetBoxId} does not exist in this device`);
        }

        // Update
        await this.widgetBoxRepository.update(widgetBoxId, {...putWidgetBoxDto});

        this.logger.log(`Success to update widget box. Successfully updated widget box with id: ${widgetBoxId}`);
        return {
          message: 'Widget box updated successfully.',
          data: putWidgetBoxDto,
        };
      } else {
        // Create
        widgetBoxId = uuidv4();
        await this.widgetBoxRepository.save({...putWidgetBoxDto, id: widgetBoxId, device_id: deviceId});

        this.logger.log(`Success to create widget box. Successfully created widget box with id: ${widgetBoxId}`);
        return {
          message: 'Widget box created successfully.',
          data: putWidgetBoxDto,
        };
      }
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to create or update widget box with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to create or update widget box, please try again later');
    }
  }

  async getWidgetBoxesList(organizationId: string, deviceId: string) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      const widgetBoxes = await this.widgetBoxRepository.find({
        select: { id: true, name: true, pin: true, unit: true, min_value: true, max_value: true, default_value: true, created_at: true },
        where: { device_id: deviceId },
        order: { id: 'ASC' },
      });
      this.logger.log(`Success to get widget boxes list. Successfully retrieved widget boxes with device id: ${deviceId}`);
      return {
        message: 'Widget boxes list retrieved successfully.',
        data: widgetBoxes,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get widget boxes list with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get widget boxes list, please try again later');
    }
  }

  async getWidgetBox(organizationId: string, deviceId: string, widgetBoxId: string) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      const widgetBox = await this.widgetBoxRepository.findOne({
        select: { id: true, name: true, pin: true, unit: true, min_value: true, max_value: true, default_value: true, created_at: true },
        where: { id: widgetBoxId, device_id: deviceId },
      });
      this.logger.log(`Success to get widget box by id. Successfully retrieved widget box details with device id: ${deviceId}`);
      return {
        message: 'Widget box details retrieved successfully.',
        data: widgetBox,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get widget box by id with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get widget box by id, please try again later');
    }
  }

  async deleteWidgetBox(organizationId: string, deviceId: string, widgetBoxId: string) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      await this.widgetBoxRepository.delete(widgetBoxId);

      this.logger.log(`Success to delete widget box. Successfully deleted widget boxes with device id: ${deviceId}`);
      return {
        message: 'Widget box deleted successfully.',
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to delete widget box with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete widget box, please try again later');
    }
  }

  async getReport(organizationId: string, deviceId: string, pin: string, start: string, end: string) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      const where: any = { device_id: deviceId };
      if (pin !== null && pin !== undefined) {
        where.pin = pin;
      }
      if (start && end) {
        where.time = Between(new Date(start), new Date(end));
      }
      const reports = await this.deviceDataRepository.find({
        select: { pin: true, value: true, time: true },
        where,
        order: { time: 'ASC' },
      });

      this.logger.log(`Success to get device report. Successfully retrieved report with device id: ${deviceId}`);
      return {
        message: 'Report retrieved successfully.',
        data: reports,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get device report with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get device report, please try again later');
    }
  }

  async postNotificationEvent(organizationId: string, deviceId: string, postNotificationEvent: dto.PostNotificationEventDto) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      const newNotificationEvent = this.notificationEventRepository.create ({
        ...postNotificationEvent,
        id: uuidv4(),
        device_id: deviceId,
      })
      await this.notificationEventRepository.save(newNotificationEvent);

      this.logger.log(`Success to create notification events. Successfully created notification events with device id: ${deviceId}`);
      return {
        message: 'Notification events created successfully.',
        data: newNotificationEvent,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to create notification events with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to create notification events, please try again later');
    }
  }

  async getNotificationEventsList(organizationId: string, deviceId: string) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      const notificationEvent = await this.notificationEventRepository.find({
        select: { id: true, pin: true, subject: true, comparison_type:true, threshold_value: true, is_active: true, created_at: true },
        where: { device_id: deviceId },
      });
      this.logger.log(`Success to get notification events list. Successfully retrieved notification events list with device id: ${deviceId}`);
      return {
        message: 'Notification events list retrieved successfully.',
        data: notificationEvent,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get notification events list with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get notification events list, please try again later');
    }
  }

  async getNotificationEvent(organizationId: string, deviceId: string, notificationEventId: string) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      const notificationEvent = await this.notificationEventRepository.findOne({
        select: { id: true, pin: true, subject: true, message: true, comparison_type:true, threshold_value: true, is_active: true, created_at: true },
        where: { device_id: deviceId, id: notificationEventId },
      });
      this.logger.log(`Success to get notification events by id. Successfully retrieved spesific notification events with device id: ${deviceId}`);
      return {
        message: 'Notification events retrieved successfully.',
        data: notificationEvent,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get notification events by id, with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get notification events by id, please try again later');
    }
  }

  async patchNotificationEvent(organizationId: string, deviceId: string, notificationEventId: string, patchNotificationEvent: dto.PatchNotificationEventDto) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      // Check notification event id
      const existingNotificationEvent = await this.notificationEventRepository.findOneBy({ id: notificationEventId });
      if (!existingNotificationEvent) {
        this.logger.error(`Failed to update notification events with device id: ${deviceId} and notification event id: ${notificationEventId}, Error: Notification events not found`);
        throw new BadRequestException('Notification events not found');
      }

      await this.notificationEventRepository.update({ id: notificationEventId }, patchNotificationEvent);
      this.logger.log(`Success to update notification events. Successfully updated notification events with device id: ${deviceId}`);
      return {
        message: 'Notification events updated successfully.',
        data: patchNotificationEvent,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to update notification events with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to update notification events, please try again later');
    }
  }

  async deleteNotificationEvent(organizationId: string, deviceId: string, notificationEventId: string) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      await this.notificationEventRepository.delete({ id: notificationEventId });
      this.logger.log(`Success to delete notification events. Successfully deleted notification events with device id: ${deviceId}`);
      return {
        message: 'Notification events deleted successfully.',
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to delete notification events with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete notification events, please try again later');
    }
  }
}
