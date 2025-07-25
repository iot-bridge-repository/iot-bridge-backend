import { Controller, Logger, Req, UseGuards, Get, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiOkResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { NotificationsApiService } from './notifications-api.service';
import AuthenticatedRequest from '../common/interfaces/authenticated-request.interface';
import { UserRolesGuard } from '../common/guards/user-roles.guard';
import { UserRoles } from '../common/decorators/user-roles.decorator';
import { UserRole } from '../common/entities';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsApiController {
  private readonly logger = new Logger(NotificationsApiController.name);
  constructor(
    private readonly notificationsApiService: NotificationsApiService
  ) {}

  @ApiOperation({ summary: 'Get notifications' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Notifications.',
        data: [
          {
            id: "15b292bc-2e5f-4d5d-a808-c5c3dd951073",
            subject: "Pengajuan organisasi baru: POKDAKAN BINTANG ROSELA JAYA 3",
            message: "User pak Eko mengajukan organisasi: POKDAKAN BINTANG ROSELA JAYA 3",
            type: "organization_propose",
            created_at: "2025-04-26T13:21:37.416Z"
          },
        ]
      }
    }
  })
  @Get('')
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.LOCAL_MEMBER)
  async get(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get notifications`);
    return this.notificationsApiService.get(request.user.id);
  }

  @ApiOperation({ summary: 'Delete notification by id' })
  @ApiParam({ name: 'notificationId', type: String, description: 'Notification id' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Successfully delete notification.',
      }
    }
  })
  @Delete(':notificationId')
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.LOCAL_MEMBER)
  async delete(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to delete notification by id`);
    return this.notificationsApiService.delete(request.params.notificationId);
  }

  @ApiOperation({ summary: 'Delete all notifications' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Successfully delete all notifications.',
      }
    }
  })
  @Delete('')
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.LOCAL_MEMBER)
  async deleteAll(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to delete all notifications`);
    return this.notificationsApiService.deleteAll(request.user.id);
  }
}
