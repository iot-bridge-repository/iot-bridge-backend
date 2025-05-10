import { Injectable, Logger, HttpException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from "uuid";
import * as dto from './dto';
import { Device } from '../common/entities';

@Injectable()
export class DevicesApiService {
  private readonly logger = new Logger(DevicesApiService.name);
  constructor(
    @InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
  ) { }

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

      this.logger.log(`Device created in organization with id: ${organizationId}`);
      return {
        message: "Device created successfully.",
        data: newDevice
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to create device in organization with id: ${organizationId}, Error: ${error.message}`);
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

      this.logger.log(`Organization with id: ${organizationId} get device list with number of devices: ${devices.length}`);
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
        message: 'Device details.',
        data: devices,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get device details, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get device details, please try again later');
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
}
