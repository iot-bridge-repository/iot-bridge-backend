import { Injectable, Logger, HttpException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere, Between } from 'typeorm';
import { v4 as uuidv4 } from "uuid";
import * as dto from './dto';
import { Device, WidgetBoxes, DeviceData, NotificationEvents } from '../common/entities';

@Injectable()
export class DevicesApiService {
  private readonly logger = new Logger(DevicesApiService.name);
  constructor(
    @InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
    @InjectRepository(WidgetBoxes) private readonly widgetBoxesRepository: Repository<WidgetBoxes>,
    @InjectRepository(DeviceData) private readonly deviceDataRepository: Repository<DeviceData>,
    @InjectRepository(NotificationEvents) private readonly notificationEventsRepository: Repository<NotificationEvents>,
  ) { }

  private async checkDeviceandOrganizationId(organizationId: string, deviceId: string) {
    const device = await this.deviceRepository.findOne({
      select: { id: true },
      where: { id: deviceId, organization_id: organizationId, },
    });
    if (!device) {
      this.logger.warn(`Device with id: ${deviceId} does not exist in organization with id: ${organizationId}`);
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
        this.logger.warn(`Device with name: ${postDto.name} already exists in organization with id: ${organizationId}`);
        throw new BadRequestException(`Device with name: ${postDto.name} already exists in this organization`);
      }

      const newDevice = this.deviceRepository.create({
        id: uuidv4(),
        organization_id: organizationId,
        name: postDto.name,
        auth_code: uuidv4(),
      })
      await this.deviceRepository.save(newDevice);

      this.logger.log(`Device with name: ${postDto.name} created in organization with id: ${organizationId}`);
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

  async getList(organizationId: string, name: string) {
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

      this.logger.log(`Successfully retrieved organization device list`);
      return {
        message: 'List of your organization devices.',
        data: devices,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get organization device list, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get organization device list, please try again later');
    }
  }

  async get(organizationId: string, deviceId: string) {
    try {
      const devices = await this.deviceRepository.findOne({
        select: { id: true, name: true, auth_code: true },
        where: { organization_id: organizationId, id: deviceId }
      });

      this.logger.log(`Get device with id: ${deviceId} in organization with id: ${organizationId}`);
      return {
        message: 'Specific device details.',
        data: devices,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get specific device details, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get specific device details, please try again later');
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
        this.logger.warn(`Device with name: ${postDto.name} already exists in organization with id: ${organizationId}`);
        throw new BadRequestException(`Device with name: ${postDto.name} already exists in this organization`);
      }

      await this.deviceRepository.update(deviceId, { name: postDto.name });

      this.logger.log(`Device updated in organization with id: ${organizationId}`);
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

      this.logger.log(`Successfully deleted device with id: ${deviceId}`);
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

  async putWidgetBoxes(organizationId: string, deviceId: string, putWidgetBoxesDto: dto.PutWidgetBoxesDto) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      let widgetBoxId = putWidgetBoxesDto.id;
      if (widgetBoxId) {
        // Check id
        const existingWidgetBox = await this.widgetBoxesRepository.findOne({
          select: { id: true },
          where: { id: widgetBoxId, device_id: deviceId },
        });
        if (!existingWidgetBox) {
          this.logger.warn(`Widget box with id: ${widgetBoxId} does not exist in device with id: ${deviceId}`);
          throw new BadRequestException(`Widget box with id: ${widgetBoxId} does not exist in this device`);
        }

        // Update
        await this.widgetBoxesRepository.update(widgetBoxId, {...putWidgetBoxesDto});

        this.logger.log(`Successfully updated widget box with id: ${widgetBoxId}`);
        return {
          message: 'Widget box updated successfully.',
          data: putWidgetBoxesDto,
        };
      } else {
        // Create
        widgetBoxId = uuidv4();
        await this.widgetBoxesRepository.save({...putWidgetBoxesDto, id: widgetBoxId, device_id: deviceId});

        this.logger.log(`Successfully created widget box with id: ${widgetBoxId}`);
        return {
          message: 'Widget box created successfully.',
          data: putWidgetBoxesDto,
        };
      }
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to create or update widget boxes with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to create or update widget boxes, please try again later');
    }
  }

  async getWidgetBoxesList(organizationId: string, deviceId: string) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      const widgetBoxes = await this.widgetBoxesRepository.find({
        select: { id: true, name: true, pin: true, unit: true, min_value: true, max_value: true, default_value: true, created_at: true },
        where: { device_id: deviceId },
        order: { id: 'ASC' },
      });
      this.logger.log(`Successfully retrieved widget boxes with device id: ${deviceId}`);
      return {
        message: 'Widget boxes list retrieved successfully.',
        data: widgetBoxes,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get widget boxes with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get widget boxes, please try again later');
    }
  }

  async getWidgetBoxes(organizationId: string, deviceId: string, widgetBoxId: string) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      const widgetBoxes = await this.widgetBoxesRepository.findOne({
        select: { id: true, name: true, pin: true, unit: true, min_value: true, max_value: true, default_value: true, created_at: true },
        where: { id: widgetBoxId, device_id: deviceId },
      });
      this.logger.log(`Successfully retrieved widget boxes details with device id: ${deviceId}`);
      return {
        message: 'Widget boxes details retrieved successfully.',
        data: widgetBoxes,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get widget boxes details with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get widget boxes details, please try again later');
    }
  }

  async deleteWidgetBoxesDetails(organizationId: string, deviceId: string, widgetBoxId: string) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      await this.widgetBoxesRepository.delete(widgetBoxId);

      this.logger.log(`Successfully deleted widget boxes with device id: ${deviceId}`);
      return {
        message: 'Widget boxes deleted successfully.',
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to delete widget boxes with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete widget boxes, please try again later');
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

      this.logger.log(`Successfully retrieved report with device id: ${deviceId}`);
      return {
        message: 'Report retrieved successfully.',
        data: reports,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get report with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get report, please try again later');
    }
  }

  async postNotificationEvents(organizationId: string, deviceId: string, postNotificationEvents: dto.PostNotificationEventsDto) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      const newNotificationEvents = this.notificationEventsRepository.create ({
        ...postNotificationEvents,
        id: uuidv4(),
        device_id: deviceId,
      })
      await this.notificationEventsRepository.save(newNotificationEvents);

      this.logger.log(`Successfully created notification events with device id: ${deviceId}`);
      return {
        message: 'Notification events created successfully.',
        data: newNotificationEvents,
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

      const notificationEvents = await this.notificationEventsRepository.find({
        select: { id: true, pin: true, subject: true, comparison_type:true, threshold_value: true, is_active: true, created_at: true },
        where: { device_id: deviceId },
      });
      this.logger.log(`Successfully retrieved notification events list with device id: ${deviceId}`);
      return {
        message: 'Notification events list retrieved successfully.',
        data: notificationEvents,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get notification events list with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get notification events list, please try again later');
    }
  }

  async getNotificationEvents(organizationId: string, deviceId: string, notificationEventId: string) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      const notificationEvents = await this.notificationEventsRepository.findOne({
        select: { id: true, pin: true, subject: true, message: true, comparison_type:true, threshold_value: true, is_active: true, created_at: true },
        where: { device_id: deviceId, id: notificationEventId },
      });
      this.logger.log(`Successfully retrieved spesific notification events with device id: ${deviceId}`);
      return {
        message: 'Notification events retrieved successfully.',
        data: notificationEvents,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get specific notification events with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get specific notification events, please try again later');
    }
  }

  async patchNotificationEvents(organizationId: string, deviceId: string, notificationEventId: string, patchNotificationEvents: dto.PatchNotificationEventsDto) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      // Check notification event id
      const existingNotificationEvents = await this.notificationEventsRepository.findOneBy({ id: notificationEventId });
      if (!existingNotificationEvents) {
        this.logger.error(`Failed to update notification events with device id: ${deviceId} and notification event id: ${notificationEventId}, Error: Notification events not found`);
        throw new BadRequestException('Notification events not found');
      }

      await this.notificationEventsRepository.update({ id: notificationEventId }, patchNotificationEvents);
      this.logger.log(`Successfully updated notification events with device id: ${deviceId}`);
      return {
        message: 'Notification events updated successfully.',
        data: patchNotificationEvents,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to update notification events with device id: ${deviceId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to update notification events, please try again later');
    }
  }

  async deleteNotificationEvents(organizationId: string, deviceId: string, notificationEventId: string) {
    try {
      // Check device and organization id
      await this.checkDeviceandOrganizationId(organizationId, deviceId);

      await this.notificationEventsRepository.delete({ id: notificationEventId });
      this.logger.log(`Successfully deleted notification events with device id: ${deviceId}`);
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
