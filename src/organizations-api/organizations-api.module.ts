import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsApiService } from './organizations-api.service';
import { OrganizationsApiController } from './organizations-api.controller';
import { AuthApiModule } from 'src/auth-api/auth-api.module';
import { User, UserNotification, Organization, OrganizationMember } from '../common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserNotification, Organization, OrganizationMember]),
    AuthApiModule,
  ],
  providers: [OrganizationsApiService],
  controllers: [OrganizationsApiController],
})
export class OrganizationsApiModule {}
