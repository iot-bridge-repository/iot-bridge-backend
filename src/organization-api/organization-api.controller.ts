import { Controller, Logger, UseGuards, Req, Body, Post, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { OrganizationApiService } from './organization-api.service';
import * as dto from './dto';
import AuthenticatedRequest from '../common/interfaces/authenticated-request.interface';
import { UserRolesGuard } from '../common/guards/user-roles.guard';
import { UserRoles } from '../common/decorators/user-roles.decorator';
import { UserRole } from '../common/entities';

@ApiTags('Organization')
@ApiBearerAuth()
@Controller('organization')
@UseGuards(UserRolesGuard)
export class OrganizationApiController {
  private readonly logger = new Logger(OrganizationApiController.name);
  constructor(
    private readonly organizationApiService: OrganizationApiService
  ) {}

  @ApiOperation({ summary: 'Propose an organization' })
  @ApiOkResponse({
    description: 'Organization proposed successfully',
    schema: {
      example: {
        message: "Organization proposed successfully.",
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
            "id": "4cd1eb2f-319f-42aa-8a04-40e1728ecdfc",
            "name": "POKDAKAN BINTANG ROSELA JAYA",
            "description": null,
            "organization_picture": null,
            "is_verified": false,
            "created_by": "da50de59-1f67-4007-ab33-3de8d08825b9",
            "created_at": "2025-04-26T07:40:39.715Z"
          }
        ]
      }
    }
  })
  @Get('list')
  async getList(@Req() request: AuthenticatedRequest) {
    this.logger.log(`There is a request to get organization list`);
    console.log('ASW', request.user.id, request.user.role);
    return this.organizationApiService.getList(request.user.id, request.user.role);
  }
}
