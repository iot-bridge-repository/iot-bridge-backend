import { Controller, Logger, UseGuards, Req, Body, Post, Get, Patch, Delete, Query, Put, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiBearerAuth, ApiTags, ApiParam } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { DevicesApiService } from './devices-api.service';
import * as dto from './dto';
import AuthenticatedRequest from '../common/interfaces/authenticated-request.interface';
import { OrganizationMemberRolesGuard } from '../common/guards/organization-member-roles.guard';
import { OrganizationMemberRoles } from '../common/decorators/organization-member-roles.decorator';
import { OrganizationMemberRole } from '../common/entities';

@ApiTags('Devices')
@ApiBearerAuth()
@ApiParam({ name: 'organizationId', type: String, description: 'Organization id' })
@UseInterceptors(CacheInterceptor)
@Controller('organizations/:organizationId/devices')
export class DevicesApiController {
  private readonly logger = new Logger(DevicesApiController.name);
  constructor(
    private readonly devicesApiService: DevicesApiService
  ) { }

  @ApiOperation({ summary: 'Create a new device (organization operator minimal role)' })
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

  @ApiOperation({ summary: 'Search devices (organization viewer minimal role)' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'List of organization device.',
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
  @Get('search')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.VIEWER)
  async getSearch(@Req() request: AuthenticatedRequest, @Query('name') query: string) {
    this.logger.log(`There is a request to get search device`);
    return this.devicesApiService.getSearch(request.params.organizationId, query);
  }

  @ApiOperation({ summary: 'Get device by id (organization viewer minimal role)' })
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

  @ApiOperation({ summary: 'Update device (organization operator minimal role)' })
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

  @ApiOperation({ summary: 'Delete device (organization operator minimal role)' })
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

  @ApiOperation({ summary: 'Get pin list (organization operator minimal role)' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Pin list.',
        data: [ "V1", "V2", "V3", "V4" ],
      }
    }
  })
  @Get(':deviceId/pin-list')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.OPERATOR)
  async getPinList(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get pin list`);
    return this.devicesApiService.getPinList(request.params.deviceId);
  }

  @ApiOperation({ summary: 'Create or update widget box (organization operator minimal role)' })
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
  async putWidgetBox(@Req() request: AuthenticatedRequest, @Body() putWidgetBoxDto: dto.PutWidgetBoxDto) {
    this.logger.log(`There is a request to create or update widget box`);
    return this.devicesApiService.putWidgetBox(request.params.organizationId, request.params.deviceId, putWidgetBoxDto);
  }

  @ApiOperation({ summary: 'Get widget box list (organization viewer minimal role)' })
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

  @ApiOperation({ summary: 'Get widget box by id (organization viewer minimal role)' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiParam({ name: 'widgetBoxId', type: String, description: 'Widget box id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Widget box details retrieved successfully.',
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
  async getWidgetBox(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get widget box by id`);
    return this.devicesApiService.getWidgetBox(request.params.organizationId, request.params.deviceId, request.params.widgetBoxId);
  }

  @ApiOperation({ summary: 'Delete widget box (organization operator minimal role)' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiParam({ name: 'widgetBoxId', type: String, description: 'Widget box id' })
  @ApiOkResponse({
    schema: {
      example: { message: 'Widget box deleted successfully.' }
    }
  })
  @Delete(':deviceId/widget-boxes/:widgetBoxId')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.OPERATOR)
  async deleteWidgetBox(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to delete widget box`);
    return this.devicesApiService.deleteWidgetBox(request.params.organizationId, request.params.deviceId, request.params.widgetBoxId);
  }

  @ApiOperation({ summary: 'Get device report (organization viewer minimal role)' })
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
    return this.devicesApiService.getReport(request.params.organizationId, request.params.deviceId, pin, start, end);
  }

  @ApiOperation({ summary: 'Create notification events (organization operator minimal role)' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Notification events created successfully.',
        data: {
          id: '7ff5017f-fca7-46c7-bb7f-359e295ff919',
          device_id: '560d8eda-8eae-4e9f-bf6e-50ab884c72ef',
          pin: 'V1',
          subject: 'suhu telalu dingin',
          message: 'suhu telalu dingin, nyalakan pompa',
          comparison_type: '=',
          threshold_value: '50',
          is_active: true,
          created_at: '2025-05-10T23:31:19.967Z'
        }
      }
    }
  })
  @Post(':deviceId/notification-events')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.OPERATOR)
  async postNotificationEvent(@Req() request: AuthenticatedRequest, @Body() postNotificationEvent: dto.PostNotificationEventDto) {
    this.logger.log(`There is a request to create notification events`);
    return this.devicesApiService.postNotificationEvent(request.params.organizationId, request.params.deviceId, postNotificationEvent);
  }

  @ApiOperation({ summary: 'Get notification events list (organization viewer minimal role)' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Notification events list retrieved successfully.',
        data: [
          {
            id: '10ce4d51-2631-4e8a-ae83-5b6869fa8eee',
            pin: 'V1',
            subject: 'suhu telalu panas',
            comparison_type: '>',
            threshold_value: 50,
            is_active: true,
            created_at: '2025-05-10T23:33:35.297Z'
          }
        ]
      }
    }
  })
  @Get(':deviceId/notification-events/list')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.VIEWER)
  async getNotificationEventsList(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get notification events list`);
    return this.devicesApiService.getNotificationEventsList(request.params.organizationId, request.params.deviceId);
  }

  @ApiOperation({ summary: 'Get notification events by id (organization viewer minimal role)' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiParam({ name: 'notificationEventId', type: String, description: 'Notification event id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Notification events retrieved successfully.',
        data: {
          id: '10ce4d51-2631-4e8a-ae83-5b6869fa8eee',
          pin: 'V1',
          subject: 'suhu telalu panas',
          message: 'suhu telalu panas, nyalakan penyiraman',
          comparison_type: '>',
          threshold_value: 50,
          is_active: true,
          created_at: '2025-05-10T23:33:35.297Z'
        }
      }
    }
  })
  @Get(':deviceId/notification-events/:notificationEventId')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.VIEWER)
  async getNotificationEvent(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get notification events by id`);
    return this.devicesApiService.getNotificationEvent(request.params.organizationId, request.params.deviceId, request.params.notificationEventId);
  }

  @ApiOperation({ summary: 'Update notification events (organization operator minimal role)' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiParam({ name: 'notificationEventId', type: String, description: 'Notification event id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Notification events updated successfully.',
        data: {
          pin: 'V1',
          subject: 'suhu telalu panas',
          message: 'suhu telalu panas, nyalakan penyiraman',
          comparison_type: '>',
          threshold_value: '100',
          is_active: true
        }
      }
    }
  })
  @Patch(':deviceId/notification-events/:notificationEventId')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.OPERATOR)
  async patchNotificationEvent(@Req() request: AuthenticatedRequest, @Body() patchNotificationEvent: dto.PatchNotificationEventDto) {
    this.logger.log(`There is a request to update notification events`);
    return this.devicesApiService.patchNotificationEvent(request.params.organizationId, request.params.deviceId, request.params.notificationEventId, patchNotificationEvent);
  }

  @ApiOperation({ summary: 'Delete notification events (organization operator minimal role)' })
  @ApiParam({ name: 'deviceId', type: String, description: 'Device id' })
  @ApiParam({ name: 'notificationEventId', type: String, description: 'Notification event id' })
  @ApiOkResponse({
    schema: {
      example: { message: 'Notification events deleted successfully.' }
    }
  })
  @Delete(':deviceId/notification-events/:notificationEventId')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.OPERATOR)
  async deleteNotificationEvent(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to delete notification events`);
    return this.devicesApiService.deleteNotificationEvent(request.params.organizationId, request.params.deviceId, request.params.notificationEventId);
  }
}
