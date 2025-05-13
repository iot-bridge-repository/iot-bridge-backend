import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Logger, HttpException, BadRequestException, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserNotification, Organization, OrganizationMember, OrganizationMemberRole, OrganizationMemberStatus } from '../common/entities';
import * as dto from './dto';

@Injectable()
export class OrganizationsApiService {
  private readonly logger = new Logger(OrganizationsApiService.name);
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserNotification) private readonly userNotificationRepository: Repository<UserNotification>,
    @InjectRepository(Organization) private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember) private readonly organizationMemberRepository: Repository<OrganizationMember>,
    private readonly configService: ConfigService,
  ) { }

  async getList(id: string) {
    try {
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

      this.logger.log(`Success to get organization list. User with id: ${id} get list of organizations with number of organizations: ${memberOrganizations.length}`);
      return {
        message: 'Your organizations list.',
        data: memberOrganizations,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get organization list by id: ${id}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get organization list, please try again later');
    }
  }

  async postPropose(id: string, postProposeDto: dto.PostProposeDto) {
    try {
      // Check if user exists
      const user = await this.userRepository.findOne({
        select: { username: true },
        where: { id }
      });
      if (!user) {
        this.logger.warn(`Failed to propose organization. User with id ${id} does not exist`);
        throw new NotFoundException('User does not exist');
      }
      // Check if organization already exists
      const existingOrganization = await this.organizationRepository.findOne({
        select: { id: true },
        where: { name: postProposeDto.name }
      });
      if (existingOrganization) {
        this.logger.warn(`Failed to propose organization. Organization ${postProposeDto.name} already exists`);
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

      // Create admin organization
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
          subject: `Pengajuan organisasi baru`,
          message: `User ${user.username} mengajukan organisasi: ${newOrganization.name}`,
          type: 'organization_propose',
        }))
      );

      this.logger.log(`Success to propose organization. Organization ${newOrganization.name} proposed by user with id ${id}`);
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

  async patchVerify(patchVerifyDto: dto.PatchVerifyDto) {
    try {
      // Check if organization exists
      const organization = await this.organizationRepository.findOne({
        select: { created_by: true, name: true },
        where: { id: patchVerifyDto.organization_id }
      });
      if (!organization) {
        this.logger.warn(`Failed to verify organization. Organization with id ${patchVerifyDto.organization_id} does not exist`);
        throw new BadRequestException('Organization does not exist');
      }

      // Verify organization
      await this.organizationRepository.update({ id: patchVerifyDto.organization_id }, { is_verified: true });

      // Create notification for user
      const userNotification = this.userNotificationRepository.create({
        id: uuidv4(),
        user_id: organization.created_by,
        subject: `Organisasi telah diverifikasi`,
        message: `Organisasi ${organization.name} anda telah diverifikasi, silahkan mengelola organisasi anda :)`,
        type: 'organization_verified',
      });
      await this.userNotificationRepository.save(userNotification);

      this.logger.log(`Success to verify organization. Organization with id ${patchVerifyDto.organization_id} verified`);
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
      const organization = await this.organizationRepository.findOne({
        select: { created_by: true, name: true },
        where: { id: patchUnverifyDto.organization_id }
      });
      if (!organization) {
        this.logger.warn(`Failed to unverify organization. Organization with id ${patchUnverifyDto.organization_id} does not exist`);
        throw new BadRequestException('Organization does not exist');
      }

      // Unverify organization
      await this.organizationRepository.update({ id: patchUnverifyDto.organization_id }, { is_verified: false });

      // Create notification for user
      const userNotification = this.userNotificationRepository.create({
        id: uuidv4(),
        user_id: organization.created_by,
        subject: `Organisasi tidak diverifikasi`,
        message: `Organisasi ${organization.name} anda tidak terverifikasi, silahkan menghubungi admin system untuk diverifikasi ulang :)`,
        type: 'organization_unverified',
      });
      await this.userNotificationRepository.save(userNotification);

      this.logger.log(`Success to unverify organization. Organization with id ${patchUnverifyDto.organization_id} unverified`);
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
      const organization = await this.organizationRepository.findOne({ where: { id: organizationId } });
      this.logger.log(`User with id: ${id} get organization profile with id: ${organizationId}`);
      return {
        message: 'Organization profile.',
        data: organization,
      };
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
        this.logger.warn(`Failed to update organization profile. Organization name already exists: ${patchOrganizationProfileDto.name}`);
        throw new BadRequestException(`Organization name already exists: ${patchOrganizationProfileDto.name}`);
      }

      // Organization profile update data
      const updateOrganizationProfile: Partial<Organization> = {
        name: patchOrganizationProfileDto.name,
        description: patchOrganizationProfileDto.description,
        location: patchOrganizationProfileDto.location
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

      this.logger.log(`Success to update organization profile. Organization profile with id ${organizationId} updated`);
      return {
        message: 'Organization profile updated successfully.',
        data: {
          id: organizationId,
          name: updateOrganizationProfile.name,
          description: updateOrganizationProfile.description,
          organization_picture: organization?.organization_picture,
          location: updateOrganizationProfile.location
        },
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to update organization profile, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to update organization profile, please try another time');
    }
  }

  async postMemberInvitation(organizationId: string, postMemberInvitationDto: dto.PostMemberInvitationDto) {
    try {
      const existingOrganizationMember = await this.organizationMemberRepository.findOne({
        select: { id: true },
        where: { user_id: postMemberInvitationDto.user_id, organization_id: organizationId }
      });
      if (existingOrganizationMember) {
        this.logger.warn(`Failed to invite member. Member with id ${postMemberInvitationDto.user_id} already exists in organization with id ${organizationId}`);
        throw new BadRequestException(`Member already exists in this organization`);
      }

      // Create new organization member
      const newOrganizationMember = this.organizationMemberRepository.create({
        id: uuidv4(),
        user_id: postMemberInvitationDto.user_id,
        organization_id: organizationId,
        role: OrganizationMemberRole.VIEWER,
        status: OrganizationMemberStatus.PENDING,
      });
      await this.organizationMemberRepository.save(newOrganizationMember);

      // Create notification for user
      const organization = await this.organizationRepository.findOne({
        select: { name: true },
        where: { id: organizationId }
      });
      const userNotification = this.userNotificationRepository.create({
        id: uuidv4(),
        user_id: postMemberInvitationDto.user_id,
        subject: `Undangan untuk bergabung di organisasi`,
        message: `Anda telah diundang untuk bergabung di organisasi: ${organization?.name}`,
        type: 'organization_member_invitation',
      });
      await this.userNotificationRepository.save(userNotification);

      this.logger.log(`Success to invite member. Member with id ${postMemberInvitationDto.user_id} added to organization with id ${organizationId}`);
      return {
        message: 'Member added successfully.',
        data: {
          organization_member: {
            id: newOrganizationMember.id,
            user_id: newOrganizationMember.user_id,
            organization_id: newOrganizationMember.organization_id,
            role: newOrganizationMember.role,
            status: newOrganizationMember.status,
          },
        },
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to invite member, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to invite member, please try another time');
    }
  }

  async patchMemberInvitationResponse(id: string, organizationId: string, patchInvitationResponseDto: dto.PatchInvitationResponseDto) {
    try {
      // Check if user in organization_members
      const existingUserOrganizationMember = await this.organizationMemberRepository.findOne({
        select: { id: true },
        where: { user_id: id, organization_id: organizationId, status: OrganizationMemberStatus.PENDING },
      })
      if (!existingUserOrganizationMember) {
        this.logger.warn(`Failed to response invite member. Member with id ${id} does not exist in organization with id ${organizationId} or has been accepted`);
        throw new BadRequestException(`Members are not invited into the organization or have already accepted`);
      }

      if (patchInvitationResponseDto.is_accepted) {
        await this.organizationMemberRepository.update({ user_id: id, organization_id: organizationId }, { status: OrganizationMemberStatus.ACCEPTED });
      } else if (!patchInvitationResponseDto.is_accepted) {
        await this.organizationMemberRepository.delete({ user_id: id, organization_id: organizationId });
      }

      // Create notification
      const [user, admin, organization] = await Promise.all([
        this.userRepository.findOne({ select: { username: true }, where: { id } }),
        this.organizationMemberRepository.findOne({ select: { user_id: true }, where: { organization_id: organizationId, role: OrganizationMemberRole.ADMIN } }),
        this.organizationRepository.findOne({ select: { name: true }, where: { id: organizationId } }),
      ]);
      if (!user) {
        this.logger.warn(`Failed to response invite member. No user found with id ${id} in organization with id ${organizationId}`);
        throw new NotFoundException('User not found');
      }
      if (!admin) {
        this.logger.warn(`Failed to response invite member. No admin found in organization with id ${organizationId}`);
        throw new ForbiddenException('No admin in organization');
      }
      if (!organization) {
        this.logger.warn(`Failed to response invite member. No organization found with id ${organizationId}`);
        throw new NotFoundException('Organization not found');
      }
      const subject = `Undangan anda ${patchInvitationResponseDto.is_accepted ? 'diterima' : 'ditolak'} oleh ${user.username}`;
      const message = `${user.username} ${patchInvitationResponseDto.is_accepted ? 'telah menjadi anggota' : 'menolak menjadi anggota'} organisasi: ${organization.name}`;
      const notification = this.userNotificationRepository.create({
        id: uuidv4(),
        user_id: admin.user_id,
        subject,
        message,
        type: 'organization_member_invitation_response',
      });
      await this.userNotificationRepository.save(notification);

      this.logger.log(`Success to response invite member. Invitation response from user with id ${id} updated`);
      return {
        message: 'Invitation response successfully.',
        data: {
          is_accepted: patchInvitationResponseDto.is_accepted,
        },
      }
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to response invite member, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to response invite member, please try another time');
    }
  }

  async postLokalMember(organizationId: string, postLokalMemberDto: dto.PostLokalMemberDto) {
    try {
      // Check if username already exists
      const existingUser = await this.userRepository.findOne({
        select: { id: true },
        where: { username: postLokalMemberDto.username }
      });
      if (existingUser) {
        this.logger.warn(`Failed to create lokal member. Username ${postLokalMemberDto.username} already exists`);
        throw new BadRequestException('Username already exists');
      }
      // Create user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(postLokalMemberDto.password, salt);
      const newUser = this.userRepository.create({
        id: uuidv4(),
        username: postLokalMemberDto.username,
        password: hashedPassword,
        role: UserRole.LOKAL_MEMBER,
        is_email_verified: true,
      });
      await this.userRepository.save(newUser);

      // Create organization member
      const newOrganizationMember = this.organizationMemberRepository.create({
        id: uuidv4(),
        user_id: newUser.id,
        organization_id: organizationId,
        role: OrganizationMemberRole.VIEWER,
        status: OrganizationMemberStatus.ACCEPTED,
      });
      await this.organizationMemberRepository.save(newOrganizationMember);

      this.logger.log(`Success to create lokal member. Lokal member created successfully`);
      return {
        message: 'Lokal member created successfully.',
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
          },
          organization: {
            id: newOrganizationMember.id,
            user_id: newOrganizationMember.user_id,
            organization_id: newOrganizationMember.organization_id,
            role: newOrganizationMember.role,
            status: newOrganizationMember.status,
          },
        },
      }
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed create lokal member, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed create lokal member, please try another time');
    }
  }

  async getMemberList(organizationId: string) {
    try {
      const organizationMemberList = await this.organizationMemberRepository
        .createQueryBuilder('om')
        .leftJoin('users', 'u', 'u.id = om.user_id')
        .select([
          'om.user_id AS user_id',
          'u.username AS username',
          'om.role AS role',
          'om.status AS status',
        ])
        .where('om.organization_id = :organizationId', { organizationId })
        .getRawMany();

      this.logger.log(`Success to get member list. Get member list for organization with id ${organizationId}`);
      return {
        message: 'List member of organization.',
        data: organizationMemberList,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get member list, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get member list, please try another time');
    }
  }

  async patchMemberRoles(organizationId: string, patchMemberRolesDto: dto.PatchMemberRolesDto) {
    try {
      // Check if member is lokal member
      const user = await this.userRepository.findOne({
        select: { id: true },
        where: { id: patchMemberRolesDto.user_id, role: UserRole.LOKAL_MEMBER }
      });
      if (user) {
        this.logger.warn(`Failed to change member role. User with id ${patchMemberRolesDto.user_id} is a lokal member`);
        throw new BadRequestException('User is a lokal member, cannot change role');
      }
      // Check if member is admin
      const admin = await this.organizationMemberRepository.findOne({
        select: { id: true },
        where: { user_id: patchMemberRolesDto.user_id, organization_id: organizationId, role: OrganizationMemberRole.ADMIN }
      });
      if (admin) {
        this.logger.warn(`Failed to change member role. User with id ${patchMemberRolesDto.user_id} is an admin and cannot change role`);
        throw new BadRequestException('User is an admin and cannot change role');
      }

      // Check if a member of the organization
      const organizationMember = await this.organizationMemberRepository.findOne({
        select: { id: true },
        where: { user_id: patchMemberRolesDto.user_id, organization_id: organizationId, status: OrganizationMemberStatus.ACCEPTED },
      });
      if (!organizationMember) {
        this.logger.warn(`Failed to change member role. User with id ${patchMemberRolesDto.user_id} is not a member of organization with id ${organizationId}`);
        throw new BadRequestException('User is not a member of this organization');
      }

      await this.organizationMemberRepository.update(
        { user_id: patchMemberRolesDto.user_id, organization_id: organizationId },
        { role: patchMemberRolesDto.new_role },
      );

      this.logger.log(`Success to change member role`);
      return {
        message: 'Member roles changed successfully.',
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to change member roles, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to change member roles, please try another time');
    }
  }

  async deleteMember(organizationId: string, userId: string) {
    try {
      // Check if is user part of the organization and is not admin
      const organizationMember = await this.organizationMemberRepository.findOne({
        select: { id: true, role: true },
        where: { user_id: userId, organization_id: organizationId, status: OrganizationMemberStatus.ACCEPTED },
      });
      if (!organizationMember) {
        this.logger.warn(`Failed to delete member. User with id ${userId} is not a member of organization with id ${organizationId}`);
        throw new BadRequestException('User is not a member of this organization');
      }
      if (organizationMember.role === OrganizationMemberRole.ADMIN) {
        this.logger.warn(`Failed to delete member. User with id ${userId} is an admin and cannot be deleted`);
        throw new BadRequestException('User is an admin and cannot be deleted');
      }

      await this.organizationMemberRepository.delete({ user_id: userId, organization_id: organizationId });

      // Check if user is lokal member
      const user = await this.userRepository.findOne({ select: { id: true, role: true }, where: { id: userId } });
      if (user?.role === UserRole.LOKAL_MEMBER) {
        await this.userRepository.delete({ id: userId });
      } else {
        // Create user notification
        const organization = await this.organizationRepository.findOne({ select: { name: true }, where: { id: organizationId } });
        const userNotification = this.userNotificationRepository.create({
          id: uuidv4(),
          user_id: user?.id,
          subject: `Anda dikeluarkan dari organisasi`,
          message: `Anda telah dikeluarkan dari organisasi: ${organization?.name}.`,
          type: 'organization_member_deleted',
        });
        await this.userNotificationRepository.save(userNotification);
      }

      this.logger.log(`Success to delete member. User with id: ${userId} deleted from organization with id: ${organizationId}`);
      return {
        message: 'Delete member successfully.',
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to delete member, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete member, please try another time');
    }
  }

  async deleteLeave(id: string, organizationId: string) {
    try {
      // Check if user is lokal member
      const user = await this.userRepository.findOne({ select: { id: true }, where: { id, role: UserRole.LOKAL_MEMBER } });
      if (user) {
        this.logger.warn(`Failed to leave organization. User with id ${id} is a lokal member`);
        throw new BadRequestException('You are a lokal member, cannot leave organization');
      }
      // Check if user is a member of the organization and is not admin
      const organizationMember = await this.organizationMemberRepository.findOne({
        select: { id: true, role: true },
        where: { user_id: id, organization_id: organizationId, status: OrganizationMemberStatus.ACCEPTED },
      });
      if (!organizationMember) {
        this.logger.warn(`Failed to leave organization. User with id ${id} is not a member of organization with id ${organizationId}`);
        throw new BadRequestException('You are not a member of this organization or not accepted the organization');
      }
      if (organizationMember.role === OrganizationMemberRole.ADMIN) {
        this.logger.warn(`Failed to leave organization. User with id ${id} is an admin and cannot leave organization`);
        throw new BadRequestException('User is an admin and cannot leave organization');
      }

      await this.organizationMemberRepository.delete({ user_id: id, organization_id: organizationId });

      // Create admin notification
      const admin = await this.organizationMemberRepository.findOne({
        select: { user_id: true },
        where: { organization_id: organizationId, role: OrganizationMemberRole.ADMIN },
      });
      const member = await this.userRepository.findOne({ select: { username: true }, where: { id: id } });
      const organization = await this.organizationRepository.findOne({ select: { name: true }, where: { id: organizationId } });
      const adminNotification = this.userNotificationRepository.create({
        id: uuidv4(),
        user_id: admin?.user_id,
        subject: `Anggota telah meninggalkan organisasi`,
        message: `Anggota dengan username ${member?.username} telah meninggalkan organisasi ${organization?.name}.`,
        type: 'organization_member_leave',
      });
      await this.userNotificationRepository.save(adminNotification);

      this.logger.log(`Success to leave organization. User with id: ${id} leave organization with id: ${organizationId}`);
      return {
        message: 'Leave organization successfully.',
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to leave organization, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to leave organization, please try another time');
    }
  }

  async getSearch(keyword: string) {
    try {
      const organizations = await this.organizationRepository
        .createQueryBuilder('o')
        .leftJoin('users', 'creator', 'o.created_by = creator.id')
        .select([
          'o.name AS name',
          'o.location AS location',
          'creator.username AS creator_username',
        ])
        .where('o.name ILIKE :keyword', { keyword: `%${keyword}%` })
        .orWhere('o.location ILIKE :keyword', { keyword: `%${keyword}%` })
        .orWhere('creator.username ILIKE :keyword', { keyword: `%${keyword}%` })
        .getRawMany();

      this.logger.log(`Success to search organizations. Successfully request to search organizations with keyword: ${keyword}`);
      return {
        message: 'List of organizations.',
        data: organizations,
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to search organization, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to search organization, please try another time');
    }
  }

  async get(organizationId: string) {
    try {
      const organizations = await this.organizationRepository
        .createQueryBuilder('o')
        .leftJoin('users', 'creator', 'o.created_by = creator.id')
        .select([
          'o.name AS name',
          'o.location AS location',
          'creator.username AS creator_username',
        ])
        .where('o.id = :organizationId', { organizationId })
        .getRawOne();
      const members = await this.organizationMemberRepository
        .createQueryBuilder('om')
        .leftJoin('users', 'user', 'om.user_id = user.id')
        .select([
          'user.username AS username',
          'om.role AS role',
          'om.status AS status',
        ])
        .where('om.organization_id = :organizationId', { organizationId })
        .getRawMany();

      this.logger.log(`Success to get organization by id. Successfully request to get organization with id: ${organizationId}`);
      return {
        message: 'Get organization successfully.',
        data: {
          name: organizations.name,
          location: organizations.location,
          creator_username: organizations.creator_username,
          members,
        },
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get organization by id: ${organizationId}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get organization by id, please try another time');
    }
  }
}
