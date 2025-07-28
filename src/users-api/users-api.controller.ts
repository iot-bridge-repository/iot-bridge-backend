import { Controller, Get, Logger, UseGuards, Req, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { UsersApiService } from './users-api.service';
import AuthenticatedRequest from '../common/interfaces/authenticated-request.interface';
import { UserRolesGuard } from '../common/guards/user-roles.guard';
import { UserRoles } from '../common/decorators/user-roles.decorator';
import { UserRole } from '../common/entities';

@ApiTags('Users')
@ApiBearerAuth()
@UseInterceptors(CacheInterceptor)
@Controller('users')
export class UsersApiController {
  private readonly logger = new Logger(UsersApiController.name);
  constructor(
    private readonly usersApiService: UsersApiService
  ) { }

  @ApiOperation({ summary: 'Search users' })
  @ApiOkResponse({
    schema: {
      example: {
        message: "Users list",
        data: [
          {
            id: "0555f6b5-c724-45a6-87cf-95786eb2a020",
            username: "Bill Valentinov",
            email: "valentinovbill0@gmail.com",
            phone_number: "085691496242",
            role: "Admin System",
          },
        ]
      }
    }
  })
  @Get('search')
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.ADMIN_SYSTEM)
  async getSearch(@Query('identity') identity: string) {
    this.logger.log(`There is a request to search users`);
    return this.usersApiService.getSearch(identity);
  }

  @ApiOperation({ summary: 'Get users by id' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID' })
  @ApiOkResponse({
    schema: {
      example: {
        message: 'Users details.',
        data: {
          username: 'Kanaya',
          email: 'valentinur8060@gmail.com',
          phone_number: '+628123456789',
          organizationMember: [
            {
              organization_name: 'POKDAKAN BINTANG ROSELA JAYA 2',
              status: 'Accepted'
            },
          ]
        }
      }
    }
  })
  @Get(':userId')
  @UseGuards(UserRolesGuard)
  @UserRoles(UserRole.ADMIN_SYSTEM)
  async get(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get users by id`);
    return this.usersApiService.get(request.params.userId);
  }
}
