import { Injectable, Logger, HttpException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from "uuid";
import * as dto from './dto';
import { Environment } from '../common/entities';

@Injectable()
export class EnvironmentsApiService {
  private readonly logger = new Logger(EnvironmentsApiService.name);
  constructor(
    @InjectRepository(Environment) private readonly environmentRepository: Repository<Environment>,
  ) { }

  async post(organizationId: string, postDto: dto.PostDto) {
    try {
      const existingEnvironment = await this.environmentRepository.findOne({
        select: { id: true },
        where: {
          name: postDto.name,
          organization_id: organizationId
        }
      })
      if (existingEnvironment) {
        this.logger.warn(`Environment already exists in organization with id: ${organizationId}`);
        throw new BadRequestException('Environment already exists in this organization');
      }

      const newEnvironment = this.environmentRepository.create({
        id: uuidv4(),
        organization_id: organizationId,
        name: postDto.name,
        topic_code: uuidv4(),
      })
      await this.environmentRepository.save(newEnvironment);

      this.logger.log(`Environment created in organization with id: ${organizationId}`);
      return {
        message: "Environment created successfully.",
        data: newEnvironment
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to create environment in organization with id: ${organizationId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to create environment, please try again later');
    }
  }
}
