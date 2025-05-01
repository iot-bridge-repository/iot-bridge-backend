import { Controller, Logger, Req, UseGuards, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NotificationApiService } from './notification-api.service';
import AuthenticatedRequest from '../common/interfaces/authenticated-request.interface';
import { UserRolesGuard } from '../common/guards/user-roles.guard';
import { UserRoles } from '../common/decorators/user-roles.decorator';
import { UserRole } from '../common/entities';

@ApiTags('Notification')
@ApiBearerAuth()
@Controller('notification')
export class NotificationApiController {
  private readonly logger = new Logger(NotificationApiController.name);
  constructor(
    private readonly notificationApiService: NotificationApiService
  ) {}

  @Get('')
  @ApiOperation({ summary: 'List of notifications' })
    @ApiOkResponse({
      description: 'List of notifications',
      schema: {
        example: {
          message: 'List of notifications.',
          data: [
            {
              subject: "Pengajuan organisasi baru: POKDAKAN BINTANG ROSELA JAYA 3",
              message: "User pak Eko mengajukan organisasi: POKDAKAN BINTANG ROSELA JAYA 3",
              created_at: "2025-04-26T13:21:37.416Z"
            },
            {
              subject: "Pengajuan organisasi baru: POKDAKAN BINTANG ROSELA JAYA 2",
              message: "User Kanaya Valentinur mengajukan organisasi: POKDAKAN BINTANG ROSELA JAYA 2",
              created_at: "2025-04-26T07:58:00.363Z"
            },
          ]
        }
      }
    })
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.LOKAL_MEMBER)
  async get(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get notifications`);
    return this.notificationApiService.get(request.user.id);
  }
}
