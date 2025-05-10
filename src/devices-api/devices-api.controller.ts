import { Controller, Logger, UseGuards, Req, Body, Post, Get, Patch, Delete, Query, Put } from '@nestjs/common';
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
  async getList(@Req() request: AuthenticatedRequest, @Query('name') query: string) {
    this.logger.log(`There is a request to get device list`);
    return this.devicesApiService.getList(request.params.organizationId, query);
  }

  @ApiOperation({ summary: 'Get specific device' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Sepecific device details.',
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
    this.logger.log(`There is a request to get specific device`);
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
    this.logger.log(`There is a request to update device`);
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
    this.logger.log(`There is a request to delete device`);
    return this.devicesApiService.delete(request.params.deviceId);
  }

  @ApiOperation({ summary: 'Create or update widget box' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Widget box created or updated successfully.',
        data: {
          id: '372176ec-f2cf-4c95-8bab-3c9315293736',
          name: 'test',
          pin: 'A1'
        }
      }
    }
  })
  @Put(':deviceId/widget-boxes')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.OPERATOR)
  async putWidgetBoxes(@Req() request: AuthenticatedRequest, @Body() putWidgetBoxesDto: dto.PutWidgetBoxesDto) {
    this.logger.log(`There is a request to create or update widget box`);
    return this.devicesApiService.putWidgetBoxes(request.params.organizationId, request.params.deviceId, putWidgetBoxesDto);
  }

  @ApiOperation({ summary: 'Get widget box list' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Widget boxes list retrieved successfully.',
        data: [
          {
            id: '35ecb3f6-8441-4aad-9861-46233f382e0c',
            name: 'suhu',
            pin: 'A1',
            unit: null,
            min_value: null,
            max_value: null,
            default_value: null,
            created_at: '2025-05-10T06:27:02.740Z'
          },
        ]
      }
    }
  })
  @Get(':deviceId/widget-boxes/list')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.VIEWER)
  async getWidgetBoxesList(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get widget boxes list`);
    return this.devicesApiService.getWidgetBoxesList(request.params.organizationId, request.params.deviceId);
  }

  @ApiOperation({ summary: 'Get specific widget box' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Widget boxes details retrieved successfully.',
        data: {
          id: '35ecb3f6-8441-4aad-9861-46233f382e0c',
          name: 'suhu',
          pin: 'A1',
          unit: null,
          min_value: null,
          max_value: null,
          default_value: null,
          created_at: '2025-05-10T06:27:02.740Z'
        }
      }
    }
  })
  @Get(':deviceId/widget-boxes/:widgetBoxId')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.VIEWER)
  async getWidgetBoxes(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get specific widget box`);
    return this.devicesApiService.getWidgetBoxes(request.params.organizationId, request.params.deviceId, request.params.widgetBoxId);
  }

  @ApiOperation({ summary: 'Delete widget box' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiOkResponse({
    schema: {
      example: { message: 'Widget boxes deleted successfully.' }
    }
  })
  @Delete(':deviceId/widget-boxes/:widgetBoxId')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.VIEWER)
  async deleteWidgetBoxes(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to delete widget boxes`);
    return this.devicesApiService.deleteWidgetBoxesDetails(request.params.organizationId, request.params.deviceId, request.params.widgetBoxId);
  }

  @ApiOperation({ summary: 'Get device report' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Report retrieved successfully.',
        data: [
          { pin: 'V2', value: 31.45, time: '2025-05-10T10:12:50.625Z' },
          { pin: 'V2', value: 47.6, time: '2025-05-10T10:12:50.625Z' },
        ]
      }
    }
  })
  @Get(':deviceId/report')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.VIEWER)
  async getReport(@Req() request: AuthenticatedRequest, @Query('start') start: string, @Query('end') end: string, @Query('pin') pin: string) {
    this.logger.log(`There is a request to get device report`);
    return this.devicesApiService.getReport(request.params.organizationId, request.params.deviceId, pin, start, end, );
  }
}
