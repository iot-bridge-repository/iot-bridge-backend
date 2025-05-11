import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthApiModule } from 'src/auth-api/auth-api.module';
import { User, Organization, OrganizationMember } from '../common/entities';
import { UsersApiService } from './users-api.service';
import { UsersApiController } from './users-api.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization, OrganizationMember]),
    AuthApiModule,
  ],
  controllers: [UsersApiController],
  providers: [UsersApiService],
})
export class UsersApiModule { }
