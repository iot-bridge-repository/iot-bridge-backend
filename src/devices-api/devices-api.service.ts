import { Injectable, Logger, HttpException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      throw new InternalServerErrorException('Failed to create Device, please try again later');
    }
  }
}
