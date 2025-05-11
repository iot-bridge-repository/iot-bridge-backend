import { Controller, Logger, UseGuards, UseInterceptors, Req, Body, Post, Get, Patch, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { OrganizationsApiService } from './organizations-api.service';
import * as dto from './dto';
import AuthenticatedRequest from '../common/interfaces/authenticated-request.interface';
import { UserRolesGuard } from '../common/guards/user-roles.guard';
import { OrganizationMemberRolesGuard } from '../common/guards/organization-member-roles.guard';
import { UserRoles } from '../common/decorators/user-roles.decorator';
import { OrganizationMemberRoles } from '../common/decorators/organization-member-roles.decorator';
import { UploadPictureInterceptorFactory } from '../common/interceptors/upload-picture.interceptor';
import { UserRole, OrganizationMemberRole } from '../common/entities';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsApiController {
  private readonly logger = new Logger(OrganizationsApiController.name);
  constructor(
    private readonly organizationsApiService: OrganizationsApiService
  ) { }

  @ApiOperation({ summary: 'Propose an organization' })
  @ApiOkResponse({
    description: 'Organization proposed successfully',
    schema: {
      example: {
        message: "Organization proposed successfully, please contanct admin system for verification.",
        data: {
          id: "cbb5e309-b7e9-424a-a0bf-a0e8b53c93b8",
          name: "Proposed Organization",
          description: null,
          organization_picture: null,
          is_verified: false,
          created_by: "cbb5e309-b7e9-424a-a0bf-a0e8b53c93b8",
          created_at: "2025-04-26T01:31:42.530Z"
        }
      }
    }
  })
  @Post('propose')
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.REGULAR_USER)
  async postPropose(@Req() request: AuthenticatedRequest, @Body() postProposeDto: dto.PostProposeDto) {
    this.logger.log(`There is a request to propose an organization`);
    return this.organizationsApiService.postPropose(request.user.id, postProposeDto);
  }

  @ApiOperation({ summary: 'Get list of organizations' })
  @ApiOkResponse({
    description: 'List of organizations',
    schema: {
      example: {
        message: "List of organizations",
        data: [
          {
            id: "9acc6316-f8b0-44a7-9b2f-f8f9005c2973",
            name: "POKDAKAN BINTANG ROSELA JAYA 2",
            description: null,
            is_verified: false,
            created_by: "da50de59-1f67-4007-ab33-3de8d08825b9",
            creator_username: "Kanaya"
          },
        ]
      }
    }
  })
  @Get('list')
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.LOKAL_MEMBER)
  async getList(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get organization list`);
    return this.organizationsApiService.getList(request.user.id);
  }

  @ApiOperation({ summary: 'Verify organization' })
  @ApiOkResponse({
    description: 'Organization verified successfully',
    schema: {
      example: {
        message: "Organization verified successfully",
      }
    }
  })
  @Patch('verify')
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.ADMIN_SYSTEM)
  async patchVerify(@Body() patchVerifyDto: dto.PatchVerifyDto) {
    this.logger.log(`There is a request to verify an organization`);
    return this.organizationsApiService.patchVerify(patchVerifyDto);
  }

  @ApiOperation({ summary: 'Unverify organization' })
  @ApiOkResponse({
    description: 'Organization unverified successfully',
    schema: {
      example: {
        message: "Organization unverified successfully",
      }
    }
  })
  @Patch('unverify')
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.ADMIN_SYSTEM)
  async patchUnverify(@Body() patchUnverifyDto: dto.PatchUnverifyDto) {
    this.logger.log(`There is a request to unverify an organization`);
    return this.organizationsApiService.patchUnverify(patchUnverifyDto);
  }

  @ApiOperation({ summary: 'Get organization profile' })
  @ApiParam({ name: 'organizationId', type: String, description: 'ID organisasi' })
  @ApiOkResponse({
    description: 'Organization profile.',
    schema: {
      example: {
        message: "Organization profile.",
        data: {
          id: "9acc6316-f8b0-44a7-9b2f-f8f9005c2973",
          name: "POKDAKAN BINTANG ROSELA JAYA 2",
          description: null,
          organization_picture: null,
          is_verified: false,
          location: null,
          created_by: "da50de59-1f67-4007-ab33-3de8d08825b9",
          created_at: "2025-04-26T07:58:00.278Z"
        }
      }
    }
  })
  @Get(':organizationId/profile')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.VIEWER)
  async getOrganizationProfile(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get organization profile`);
    return this.organizationsApiService.getOrganizationProfile(request.user.id, request.params.organizationId);
  }

  @ApiOperation({ summary: 'Update organization profile' })
  @ApiParam({ name: 'organizationId', type: String, description: 'ID organisasi' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'POKDAKAN BINTANG ROSELA JAYA' },
        description: { type: 'string', example: 'description of organization' },
        organization_picture: { type: 'string', format: 'binary', description: '(optional)' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    schema: {
      example: {
        message: "Organization profile updated successfully.",
        data: {
          id: "4cd1eb2f-319f-42aa-8a04-40e1728ecdfc",
          name: "POKDAKAN BINTANG ROSELA JAYA",
          description: "kolam ikan lampung",
          organization_picture: "http://localhost:3000/uploads/organization_picture/1745810588643-360135057.png",
          location: null
        }
      }
    }
  })
  @Patch(':organizationId/profile')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.ADMIN)
  @UseInterceptors(UploadPictureInterceptorFactory('organization_picture'))
  async patchOrganizationProfile(@Req() request: AuthenticatedRequest, @Body() patchOrganizationProfileDto: dto.PatchOrganizationProfileDto) {
    this.logger.log(`There is a request to update organization profile`);
    return this.organizationsApiService.patchOrganizationProfile(request, request.params.organizationId, patchOrganizationProfileDto, request.file?.filename ?? null);
  }

  @ApiOperation({ summary: 'Get users' })
  @ApiOkResponse({
    description: 'Users list',
    schema: {
      example: {
        message: "Users list",
        data: [
          {
            id: "0555f6b5-c724-45a6-87cf-95786eb2a020",
            username: "Bill Valentinov",
            email: "valentinovbill0@gmail.com",
            phone_number: "085691496242"
          },
        ]
      }
    }
  })
  @Get('users')
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.REGULAR_USER)
  async getUsers(@Query('identity') query: string) {
    this.logger.log(`There is a request to search users`);
    return this.organizationsApiService.getUsers(query);
  }

  @ApiOperation({ summary: 'Member invitation' })
  @ApiParam({ name: 'organizationId', type: String, description: 'ID organisasi' })
  @ApiOkResponse({
    description: 'Member invitation',
    schema: {
      example: {
        message: "Member invitation successfully.",
        data: {
          organization_member: {
            id: "921df4c5-6c5c-46aa-8f60-44f0810a65c2",
            user_id: "25d35595-fd8c-4f3f-ad93-023a7c799bd4",
            organization_id: "4cd1eb2f-319f-42aa-8a04-40e1728ecdfc",
            role: "Viewer",
            status: "Pending"
          }
        }
      }
    }
  })
  @Post(':organizationId/member-invitation')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.ADMIN)
  async postAddMember(@Req() request: AuthenticatedRequest, @Body() postMemberInvitationDto: dto.PostMemberInvitationDto) {
    this.logger.log(`There is a request to invite member`);
    return this.organizationsApiService.postMemberInvitation(request.params.organizationId, postMemberInvitationDto);
  }

  @ApiOperation({ summary: 'Invitation response' })
  @ApiParam({ name: 'organizationId', type: String, description: 'ID organisasi' })
  @ApiOkResponse({
    description: 'Invitation response',
    schema: {
      example: {
        message: "Invitation response successfully.",
        data: {
          is_accepted: true,
        },
      }
    }
  })
  @Patch(':organizationId/member-invitation-response')
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.REGULAR_USER)
  async patchMemberInvitationResponse(@Req() request: AuthenticatedRequest, @Body() patchInvitationResponseDto: dto.PatchInvitationResponseDto) {
    this.logger.log(`There is a request to accept or reject invitation to join organization`);
    return this.organizationsApiService.patchMemberInvitationResponse(request.user.id, request.params.organizationId, patchInvitationResponseDto);
  }

  @ApiOperation({ summary: 'Create lokal member' })
  @ApiParam({ name: 'organizationId', type: String, description: 'ID organisasi' })
  @ApiOkResponse({
    description: 'Create lokal member',
    schema: {
      example: {
        message: 'Lokal member created successfully.',
        data: {
          user: {
            id: "25d35595-fd8c-4f3f-ad93-023a7c799bd4",
            username: "Bill Valentinov",
            role: "LOKAL_MEMBER",
          },
          organization_member: {
            id: "921df4c5-6c5c-46aa-8f60-44f0810a65c2",
            user_id: "25d35595-fd8c-4f3f-ad93-023a7c799bd4",
            organization_id: "4cd1eb2f-319f-42aa-8a04-40e1728ecdfc",
            role: "Viewer",
            status: "Accepted",
          },
        },
      }
    }
  })
  @Post(':organizationId/lokal-member')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.ADMIN)
  async postLokalMember(@Req() request: AuthenticatedRequest, @Body() lokalMemberDto: dto.PostLokalMemberDto) {
    this.logger.log(`There is a request to create lokal member`);
    return this.organizationsApiService.postLokalMember(request.params.organizationId, lokalMemberDto);
  }

  @ApiOperation({ summary: 'Get member list' })
  @ApiParam({ name: 'organizationId', type: String, description: 'ID organisasi' })
  @ApiOkResponse({
    description: 'Get member list',
    schema: {
      example: {
        message: 'Get member list successfully.',
        data: [
          {
            user_id: "da50de59-1f67-4007-ab33-3de8d08825b9",
            username: "Kanaya",
            role: "Admin",
            status: "Accepted"
          },
        ]
      }
    }
  })
  @Get(':organizationId/member-list')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.VIEWER)
  async getMemberList(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get lokal member list`);
    return this.organizationsApiService.getMemberList(request.params.organizationId);
  }

  @ApiOperation({ summary: 'Change member roles' })
  @ApiParam({ name: 'organizationId', type: String, description: 'ID organisasi' })
  @ApiOkResponse({
    description: 'Change member roles',
    schema: {
      example: {
        message: 'Member roles changed successfully.',
      }
    }
  })
  @Patch(':organizationId/member-roles')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.ADMIN)
  async patchMemberRoles(@Req() request: AuthenticatedRequest, @Body() patchMemberRolesDto: dto.PatchMemberRolesDto) {
    this.logger.log(`There is a request to change member roles`);
    return this.organizationsApiService.patchMemberRoles(request.params.organizationId, patchMemberRolesDto);
  }

  @ApiOperation({ summary: 'Delete member' })
  @ApiParam({ name: 'organizationId', type: String, description: 'ID organisasi' })
  @ApiParam({ name: 'userId', type: String, description: 'ID user' })
  @ApiOkResponse({
    description: 'Delete member',
    schema: {
      example: {
        message: 'Delete member successfully.',
      }
    }
  })
  @Delete(':organizationId/member/:userId')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.ADMIN)
  async deleteMember(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to leave organization`);
    return this.organizationsApiService.deleteMember(request.params.organizationId, request.params.userId);
  }

  @ApiOperation({ summary: 'Leave organization' })
  @ApiParam({ name: 'organizationId', type: String, description: 'ID organisasi' })
  @ApiOkResponse({
    description: 'Leave organization',
    schema: {
      example: {
        message: 'Leave organization successfully.',
      }
    }
  })
  @Delete(':organizationId/leave')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.VIEWER)
  async deleteLeave(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to leave organization`);
    return this.organizationsApiService.deleteLeave(request.user.id, request.params.organizationId);
  }
}
