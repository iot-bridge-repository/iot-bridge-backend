import { Controller, Logger, UseGuards, Req, Body, Post } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EnvironmentsApiService } from './environments-api.service';
import * as dto from './dto';
import AuthenticatedRequest from '../common/interfaces/authenticated-request.interface';
import { OrganizationMemberRolesGuard } from '../common/guards/organization-member-roles.guard';
import { OrganizationMemberRoles } from '../common/decorators/organization-member-roles.decorator';
import { OrganizationMemberRole } from '../common/entities';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations/:organizationId/environments')
export class EnvironmentsApiController {
  private readonly logger = new Logger(EnvironmentsApiController.name);
  constructor(
    private readonly environmentsApiService: EnvironmentsApiService
  ) { }

  @ApiOperation({ summary: 'Create a new environment' })
  @ApiOkResponse({
    description: 'The environment has been successfully created',
    schema: {
      example: {
        message: 'Environment created successfully.',
        data: {
          id: '05b80cd8-deab-4aa2-a119-c56cf195b44c',
          organization_id: 'e8311a6f-bbd4-4924-931d-8b601a09a517',        
          name: 'Environment test 2',
          topic_code: '118c6b16-8d43-4d79-9ed2-dd298e4570b0'
        }
      }
    }
  })
  @Post('')
  @UseGuards(OrganizationMemberRolesGuard)
  @OrganizationMemberRoles(OrganizationMemberRole.OPERATOR)
  async post(@Req() request: AuthenticatedRequest, @Body() postDto: dto.PostDto) {
    this.logger.log(`There is a request to create an environment`);
    return this.environmentsApiService.post(request.params.organizationId, postDto);
  }
}
