import { Injectable, Logger, HttpException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from "uuid";
import { User, UserRole, UserNotification, Organization } from '../common/entities';
import * as dto from './dto';

@Injectable()
export class OrganizationApiService {
  private readonly logger = new Logger(OrganizationApiService.name);
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserNotification) private readonly userNotificationRepository: Repository<UserNotification>,
    @InjectRepository(Organization) private readonly organizationRepository: Repository<Organization>,
  ) {}

  async postPropose(id: string, postProposeDto: dto.PostProposeDto) {
    try {
      // Check if user exists
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
          this.logger.warn(`User with id ${id} does not exist`);
          throw new BadRequestException('User does not exist');
        }
      // Check if organization already exists
      const existingOrganization = await this.organizationRepository.findOne({ where: { name: postProposeDto.name } });
      if (existingOrganization) {
        this.logger.warn(`Organization ${postProposeDto.name} already exists`);
        throw new BadRequestException('Organization already exists');
      }

      // Create new organization
      const newOrganization = this.organizationRepository.create({
        id: uuidv4(),
        name: postProposeDto.name,
        is_verified: false,
        created_by: id,
      });
      await this.organizationRepository.save(newOrganization);

      // Create notification for admin system
      const adminSystem = await this.userRepository.find({ where: { role: UserRole.ADMIN_SYSTEM } });
      await this.userNotificationRepository.save(
        adminSystem.map(admin => ({
          id: uuidv4(),
          user_id: admin.id,
          subject: `Pengajuan organisasi baru: ${newOrganization.name}`,
          message: `User ${user.username} mengajukan organisasi: ${newOrganization.name}`,        
        }))
      );

      this.logger.log(`Organization ${newOrganization.name} proposed by user with id ${id}`);
      return {
        message: 'Organization proposed successfully.',
        data: newOrganization,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to propose organization by id: ${id}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to propose organization, please try again later');
    }
  }
}
