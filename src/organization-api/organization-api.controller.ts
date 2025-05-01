import { Controller, Logger, UseGuards, UseInterceptors, Req, Body, Post, Get, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { OrganizationApiService } from './organization-api.service';
import * as dto from './dto';
import AuthenticatedRequest from '../common/interfaces/authenticated-request.interface';
import { UserRolesGuard } from '../common/guards/user-roles.guard';
import { OrganizationMemberRolesGuard } from '../common/guards/organization-member-roles.guard';
import { UserRoles } from '../common/decorators/user-roles.decorator';
import { OrganizationMemberRoles } from '../common/decorators/organization-member-roles.decorator';
import { UploadPictureInterceptorFactory } from '../common/interceptors/upload-picture.interceptor';
import { UserRole, OrganizationMemberRole } from '../common/entities';

@ApiTags('Organization')
@ApiBearerAuth()
@Controller('organization')
export class OrganizationApiController {
  private readonly logger = new Logger(OrganizationApiController.name);
  constructor(
    private readonly organizationApiService: OrganizationApiService
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
    return this.organizationApiService.postPropose(request.user.id, postProposeDto);
  }

  @ApiOperation({ summary: 'Get list of organizations' })
  @ApiOkResponse({
    description: 'List of organizations',
    schema: {
      example: {
        "message": "List of organizations",
        "data": [
          {
            "id": "9acc6316-f8b0-44a7-9b2f-f8f9005c2973",
            "name": "POKDAKAN BINTANG ROSELA JAYA 2",
            "description": null,
            "is_verified": false,
            "created_by": "da50de59-1f67-4007-ab33-3de8d08825b9",
            "creator_username": "Kanaya"
          },
          {
            "id": "bf32647d-a747-44ff-8693-8b73ac4cbbfb",
            "name": "POKDAKAN BINTANG ROSELA JAYA 3",
            "description": null,
            "is_verified": false,
            "created_by": "2914071d-36aa-45f3-a7f3-cf106b126f69",
            "creator_username": "pak Eko"
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
    return this.organizationApiService.getList(request.user.id, request.user.role);
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
    return this.organizationApiService.patchVerify(patchVerifyDto);
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
    return this.organizationApiService.patchUnverify(patchUnverifyDto);
  }

  @ApiOperation({ summary: 'Get organization profile' })
  @ApiParam({ name: 'organizationId', type: String, description: 'ID organisasi' })
  @ApiOkResponse({
    description: 'Organization profile',
    schema: {
      example: {
        id: "9acc6316-f8b0-44a7-9b2f-f8f9005c2973",
        name: "POKDAKAN BINTANG ROSELA JAYA 2",
        description: null,
        organization_picture: null,
        is_verified: false,
        created_by: "da50de59-1f67-4007-ab33-3de8d08825b9",
        created_at: "2025-04-26T07:58:00.278Z"
      }
    }
  })
  @Get(':organizationId/profile')
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.LOKAL_MEMBER)
  async getOrganizationProfile(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get organization profile`);
    return this.organizationApiService.getOrganizationProfile(request.user.id, request.params.organizationId);
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
        message: "Organization profile updated successfully",
        data: {
          organization: {
            id: "4cd1eb2f-319f-42aa-8a04-40e1728ecdfc",
            name: "POKDAKAN BINTANG ROSELA JAYA",
            description: "kolam ikan lampung",
            organization_picture: "http://localhost:3000/uploads/organization_picture/1745810588643-360135057.png"
          }
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
    return this.organizationApiService.patchOrganizationProfile(request, request.params.organizationId, patchOrganizationProfileDto, request.file?.filename ?? null);
  }

  @ApiOperation({ summary: 'Get members' })
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
          {
            id: "25d35595-fd8c-4f3f-ad93-023a7c799bd4",
            username: "valentinov",
            email: "bill.valentinov21@students.unila.ac.id",
            phone_number: "+62812412432"
          }
        ]
      }
    }
  })
  @Get('search-members')
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.REGULAR_USER)
  async getSearchMembers(@Query('identity') query: string) {
    this.logger.log(`There is a request to search members`);
    return this.organizationApiService.getSearchMembers(query);
  }
}
