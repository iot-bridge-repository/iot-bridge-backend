import { Controller, Logger, UseGuards, Req, Body, Post, Get, Patch, Delete } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiBearerAuth, ApiTags, ApiParam } from '@nestjs/swagger';
import { DevicesApiService } from './devices-api.service';
import * as dto from './dto';
import AuthenticatedRequest from '../common/interfaces/authenticated-request.interface';
import { OrganizationMemberRolesGuard } from '../common/guards/organization-member-roles.guard';
import { OrganizationMemberRoles } from '../common/decorators/organization-member-roles.decorator';
import { OrganizationMemberRole } from '../common/entities';

@ApiTags('Devices')
@ApiBearerAuth()
@ApiParam({ name: 'organizationId', type: String, description: 'Organization id' })
@Controller('organizations/:organizationId/devices')
export class DevicesApiController {
  private readonly logger = new Logger(DevicesApiController.name);
  constructor(
    private readonly devicesApiService: DevicesApiService
  ) { }

  @ApiOperation({ summary: 'Create a new device' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Device created successfully.',
        data: {
          id: '560d8eda-8eae-4e9f-bf6e-50ab884c72ef',
          organization_id: 'e8311a6f-bbd4-4924-931d-8b601a09a517',
          name: 'Device test',
          auth_code: '206e0e05-c67b-4e3d-be45-524120a6af4d',
          created_at: '2025-05-09T14:50:43.945Z'
        }
      }
    }
  })
  @Post('')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.OPERATOR)
  async post(@Req() request: AuthenticatedRequest, @Body() postDto: dto.PostDto) {
    this.logger.log(`There is a request to create an device`);
    return this.devicesApiService.post(request.params.organizationId, postDto);
  }

  @ApiOperation({ summary: 'Get device list' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'List of your organization devices.',
        data: [
          {
            id: '560d8eda-8eae-4e9f-bf6e-50ab884c72ef',
            name: 'Device test',
            auth_code: '206e0e05-c67b-4e3d-be45-524120a6af4d'
          },
        ]
      }
    }
  })
  @Get('list')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.VIEWER)
  async getList(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get device list`);
    return this.devicesApiService.getList(request.params.organizationId);
  }

  @ApiOperation({ summary: 'Get device' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Device details.',
        data: {
          id: '560d8eda-8eae-4e9f-bf6e-50ab884c72ef',
          name: 'Device test',
          auth_code: '206e0e05-c67b-4e3d-be45-524120a6af4d'
        },
      }
    }
  })
  @Get(':deviceId')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.VIEWER)
  async get(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get device by id`);
    return this.devicesApiService.get(request.params.organizationId, request.params.deviceId);
  }

  @ApiOperation({ summary: 'Update device' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Device updated successfully.',
        data: {
          id: 'e5f97784-e75b-4310-aa97-3d325cdb6f1d',
          name: 'Device test 3.1'
        }
      }
    }
  })
  @Patch(':deviceId')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.OPERATOR)
  async patch(@Req() request: AuthenticatedRequest, @Body() patchDto: dto.PatchDto) {
    this.logger.log(`There is a request to patch device by id`);
    return this.devicesApiService.patch(request.params.organizationId, request.params.deviceId, patchDto);
  }

  @ApiOperation({ summary: 'Delete device' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiOkResponse({
    schema: {
      example: { message: 'Device deleted successfully.' }
    }
  })
  @Delete(':deviceId')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.OPERATOR)
  async delete(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to patch device by id`);
    return this.devicesApiService.delete(request.params.deviceId);
  }
}
