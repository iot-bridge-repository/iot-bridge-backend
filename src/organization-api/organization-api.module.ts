import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationApiService } from './organization-api.service';
import { OrganizationApiController } from './organization-api.controller';
import { AuthApiModule } from 'src/auth-api/auth-api.module';
import { User, UserNotification, Organization, OrganizationMember } from '../common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserNotification, Organization, OrganizationMember]),
    AuthApiModule,
  ],
  providers: [OrganizationApiService],
  controllers: [OrganizationApiController],
})
export class OrganizationApiModule {}
