import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Logger, HttpException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from "uuid";
import { User, UserRole, UserNotification, Organization, OrganizationMember, OrganizationMemberRole, OrganizationMemberStatus } from '../common/entities';
import * as dto from './dto';

@Injectable()
export class OrganizationApiService {
  private readonly logger = new Logger(OrganizationApiService.name);
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserNotification) private readonly userNotificationRepository: Repository<UserNotification>,
    @InjectRepository(Organization) private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember) private readonly organizationMemberRepository: Repository<OrganizationMember>,
    private readonly configService: ConfigService,
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

      // Create organization member
      const newOrganizationMember = this.organizationMemberRepository.create({
        id: uuidv4(),
        user_id: id,
        organization_id: newOrganization.id,
        role: OrganizationMemberRole.ADMIN,
        status: OrganizationMemberStatus.ACCEPTED,
      });
      await this.organizationMemberRepository.save(newOrganizationMember);

      // Create notification for admin system
      const adminSystem = await this.userRepository.find({ where: { role: UserRole.ADMIN_SYSTEM } });
      await this.userNotificationRepository.save(
        adminSystem.map(admin => ({
          id: uuidv4(),
          user_id: admin.id,
          subject: `Pengajuan organisasi baru: ${newOrganization.name}`,
          message: `User ${user.username} mengajukan organisasi: ${newOrganization.name}`,
          type: 'organization_propose',
        }))
      );

      this.logger.log(`Organization ${newOrganization.name} proposed by user with id ${id}`);
      return {
        message: 'Organization proposed successfully, please contanct admin system for verification.',
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

  async getList(id: string, role: UserRole) {
    try {
      if (role == UserRole.ADMIN_SYSTEM) {
        const organizations = await this.organizationRepository
        .createQueryBuilder('o')
        .leftJoin('users', 'u', 'o.created_by = u.id')
        .select([
          'o.id AS id',
          'o.name AS name',
          'o.description AS description',
          'o.is_verified AS is_verified',
          'o.created_by AS created_by',
          'u.username AS creator_username',
        ])
        .getRawMany();

        return {
          message: 'List of all organizations.',
          data: organizations,
        };
      } else if (role == UserRole.REGULAR_USER || role == UserRole.LOKAL_MEMBER) {
        // Get organizations id where user is a member
        const memberOrganizations = await this.userRepository
          .createQueryBuilder('u')
          .leftJoin('organization_members', 'om', 'u.id = om.user_id')
          .leftJoin('organizations', 'o', 'om.organization_id = o.id')
          .leftJoin('users', 'creator', 'o.created_by = creator.id')
          .select([
            'om.organization_id AS id',
            'o.name AS name',
            'o.description AS description',
            'o.is_verified AS is_verified',
            'o.created_by AS created_by',
            'creator.username AS creator_username',
          ])
          .where('u.id = :id', { id })
          .andWhere('om.status = :status', { status: 'Accepted' })
          .getRawMany();

        this.logger.log(`User with id: ${id} get list of organizations with number of organizations: ${memberOrganizations.length}`);
        return {
          message: 'List of your organizations.',
          data: memberOrganizations,
        };
      }
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get list of organizations by id: ${id}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get list of organizations, please try again later');
    }
  }

  async patchVerify(patchVerifyDto: dto.PatchVerifyDto) {
    try {
      // Check if organization exists
      const organization = await this.organizationRepository.findOne({ select: { created_by: true, name: true }, where: { id: patchVerifyDto.organizationId } });
      if (!organization) {
        this.logger.warn(`Organization with id ${patchVerifyDto.organizationId} does not exist`);
        throw new BadRequestException('Organization does not exist');
      }

      // Verify organization
      await this.organizationRepository.update({ id: patchVerifyDto.organizationId }, { is_verified: true });

      // Create notification for user
      const userNotification = this.userNotificationRepository.create({
        id: uuidv4(),
        user_id: organization.created_by,
        subject: `Organisasi anda telah diverifikasi`,
        message: `Organisasi ${organization.name} telah diverifikasi, silahkan mengelola organisasi anda :)`,
        type: 'organization_verified',
      });
      await this.userNotificationRepository.save(userNotification);

      this.logger.log(`Organization with id ${patchVerifyDto.organizationId} verified`);
      return {
        message: 'Organization verified successfully.',
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to verify organization, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to verify organization, please try again later');
    }
  }

  async patchUnverify(patchUnverifyDto: dto.PatchUnverifyDto) {
    try {
      // Check if organization exists
      const organization = await this.organizationRepository.findOne({ select: { created_by: true, name: true }, where: { id: patchUnverifyDto.organizationId } });
      if (!organization) {
        this.logger.warn(`Organization with id ${patchUnverifyDto.organizationId} does not exist`);
        throw new BadRequestException('Organization does not exist');
      }

      // Unverify organization
      await this.organizationRepository.update({ id: patchUnverifyDto.organizationId }, { is_verified: false });

      // Create notification for user
      const userNotification = this.userNotificationRepository.create({
        id: uuidv4(),
        user_id: organization.created_by,
        subject: `Organisasi anda tidak diverifikasi`,
        message: `Organisasi ${organization.name} tidak terverifikasi, silahkan menghubungi admin system untuk diverifikasi ulang :)`,
        type: 'organization_unverified',
      });
      await this.userNotificationRepository.save(userNotification);

      this.logger.log(`Organization with id ${patchUnverifyDto.organizationId} unverified`);
      return {
        message: 'Organization unverified successfully.',
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to unverify organization, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to unverify organization, please try again later');
    }
  }

  async getOrganizationProfile(id: string, organizationId: string) {
    try {
      // Check if user is a member of the organization
      const organizationMember = await this.organizationMemberRepository.findOne({
        select: { id: true },
        where: { user_id: id, organization_id: organizationId, status: OrganizationMemberStatus.ACCEPTED },
      });
      if (!organizationMember) {
        this.logger.warn(`User with id ${id} is not a member of organization with id ${organizationId}`);
        throw new BadRequestException('You are not a member of this organization');
      }

      this.logger.log(`User with id: ${id} get organization profile with id: ${organizationId}`);
      const organization = await this.organizationRepository.findOne({ where: { id: organizationId } });
      return organization;
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get organization profile, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get organization profile, please try again later');
    }
  }

  async patchOrganizationProfile(req: Request, organizationId: string, patchOrganizationProfileDto: dto.PatchOrganizationProfileDto, organization_picture: string | null) {
    try {
      // Check if organization name duplicate
      const existingUsername = await this.organizationRepository.findOne({
        select: { id: true },
        where: { name: patchOrganizationProfileDto.name } 
      });
      if (existingUsername && existingUsername.id !== organizationId) {
        this.logger.warn(`Organization name already exists: ${patchOrganizationProfileDto.name}`);
        throw new BadRequestException(`Organization name already exists: ${patchOrganizationProfileDto.name}`);
      }

      // Organization profile update data
      const updateOrganizationProfile: Partial<Organization> = {
        name: patchOrganizationProfileDto.name,
        description: patchOrganizationProfileDto.description,
      };
      // Check if the old profile picture exists and delete it
      const organization = await this.organizationRepository.findOne({
        select: { organization_picture: true },
        where: { id: organizationId } 
      });
      // Check if the organization picture is provided
      if (organization_picture) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        updateOrganizationProfile.organization_picture = `${baseUrl}/uploads/organization_picture/${organization_picture}`;

        if (organization?.organization_picture) {
          const uploadDir = this.configService.get('NODE_ENV') === 'production'
            ? '/var/www/uploads/organization_picture'
            : './uploads/organization_picture';
          const oldFilePath = path.join(uploadDir, path.basename(organization.organization_picture));

          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      }

      // Update the organization profile
      await this.organizationRepository.update(organizationId, updateOrganizationProfile);

      this.logger.log(`Organization profile with id ${organizationId} updated`);
      return {
        message: 'Organization profile updated successfully.',
        data: {
          organization: {
            id: organizationId,
            name: updateOrganizationProfile.name,
            description: updateOrganizationProfile.description,
            organization_picture: organization?.organization_picture,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Failed to update organization profile by organization id: ${organizationId}, Error: ${error.message}`);
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to update organization profile, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to update organization profile, please try another time');
    }
  }
}
