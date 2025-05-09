import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentsApiService } from './environments-api.service';
import { EnvironmentsApiController } from './environments-api.controller';
import { AuthApiModule } from 'src/auth-api/auth-api.module';
import { Organization, OrganizationMember, Environment } from '../common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationMember, Environment]),
    AuthApiModule
  ],
  controllers: [EnvironmentsApiController],
  providers: [EnvironmentsApiService],
})
export class EnvironmentsApiModule {}
