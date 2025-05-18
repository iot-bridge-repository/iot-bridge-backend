import { Injectable, CanActivate, Logger, ExecutionContext, UnauthorizedException, InternalServerErrorException, ForbiddenException, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Request } from 'express';
import AuthenticatedRequest from '../interfaces/authenticated-request.interface';
import { ORGANIZATION_MEMBER_ROLES_KEY } from '../decorators/organization-member-roles.decorator';
import { Organization, OrganizationMemberRole, OrganizationMember, OrganizationMemberStatus } from '../entities';
import { checkToken } from '../utils/check-token.util';

@Injectable()
export class OrganizationMemberRolesGuard implements CanActivate {
  private readonly logger = new Logger(OrganizationMemberRolesGuard.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @InjectRepository(Organization) private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember) private readonly organizationMemberRepository: Repository<OrganizationMember>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<Request>();
      await checkToken(request, this.jwtService, this.logger);

      // Get required role
      const requiredRole = this.reflector.get<OrganizationMemberRole>(ORGANIZATION_MEMBER_ROLES_KEY, context.getHandler());
      if (!requiredRole) return true;

      // Get organization id from params
      const organizationId = request.params.organizationId;
      if (!organizationId) {
        this.logger.warn('Organization member roles guard: Organization ID not provided');
        throw new ForbiddenException('Organization ID not provided');
      }

      // Check if organizationId is verified
      const organization = await this.organizationRepository.findOne({
        select: { is_verified: true },
        where: { id: organizationId }
      });
      if (!organization) {
        this.logger.warn(`Organization member roles guard: Organization with id ${organizationId} does not exist`);
        throw new ForbiddenException('Organization does not exist');
      }
      if (!organization.is_verified) {
        this.logger.warn(`Organization member roles guard: Organization with id ${organizationId} is not verified`);
        throw new ForbiddenException('Organization is not verified');
      }

      // Check if user is part of the organization
      const { id } = (request as AuthenticatedRequest).user;
      const memberOrganization = await this.organizationMemberRepository.findOne({
        select: { role: true },
        where: {
          user_id: id,
          organization_id: organizationId,
          status: OrganizationMemberStatus.ACCEPTED
        },
      });
      if (!memberOrganization) {
        this.logger.warn(`Organization member roles guard: User with id ${id} is not part of the organization with id ${organizationId}`);
        throw new ForbiddenException('User not part of organization');
      }

      // Check if user has the required role
      const roleHierarchy = [OrganizationMemberRole.ADMIN, OrganizationMemberRole.OPERATOR, OrganizationMemberRole.VIEWER];
      const hasAccess = [requiredRole].some(requiredRole => roleHierarchy.indexOf(memberOrganization.role) <= roleHierarchy.indexOf(requiredRole));
      if (!hasAccess) {
        this.logger.warn(`Organization member roles guard: User with role ${memberOrganization.role} tried to access ${context.getHandler().name} without sufficient permissions`);
      throw new ForbiddenException(`Insufficient role permissions, only user with minimum role ${requiredRole} can access this resource`);
      }
      return true;
    } catch (error) {
      this.logger.warn(`Organization member roles guard: Authentication failed: ${error}`);

      if (error instanceof HttpException || error?.status || error?.response) throw error;
      if (error.name === 'TokenExpiredError') throw new UnauthorizedException('Token expired');
      if (error.name === 'JsonWebTokenError') throw new UnauthorizedException('Invalid token');
      if (['08006', '08001'].includes(error.code)) throw new InternalServerErrorException('Database error');

      throw new UnauthorizedException('Authentication failed. Please check your credentials.');
    }
  }
}
