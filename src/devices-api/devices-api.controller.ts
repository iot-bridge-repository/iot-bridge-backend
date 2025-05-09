import { Controller, Logger, UseGuards, Req, Body, Post } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DevicesApiService } from './devices-api.service';
import * as dto from './dto';
import AuthenticatedRequest from '../common/interfaces/authenticated-request.interface';
import { OrganizationMemberRolesGuard } from '../common/guards/organization-member-roles.guard';
import { OrganizationMemberRoles } from '../common/decorators/organization-member-roles.decorator';
import { OrganizationMemberRole } from '../common/entities';

@ApiTags('Devices')
@ApiBearerAuth()
@Controller('organizations/:organizationId/devices')
export class DevicesApiController {
  private readonly logger = new Logger(DevicesApiController.name);
  constructor(
    private readonly devicesApiService: DevicesApiService
  ) { }

  @ApiOperation({ summary: 'Create a new device' })
  @ApiOkResponse({
    description: 'The device has been successfully created',
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
}
