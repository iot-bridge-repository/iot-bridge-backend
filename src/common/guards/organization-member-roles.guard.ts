import { Injectable, CanActivate, Logger, ExecutionContext, UnauthorizedException, InternalServerErrorException, ForbiddenException, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { ORGANIZATION_MEMBER_ROLES_KEY } from '../decorators/organization-member-roles.decorator';
import { OrganizationMemberRole, OrganizationMember } from '../entities';

@Injectable()
export class OrganizationMemberRolesGuard implements CanActivate {
  private readonly logger = new Logger(OrganizationMemberRolesGuard.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @InjectRepository(OrganizationMember) private readonly organizationMemberRepository: Repository<OrganizationMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const requiredRoles = this.reflector.get<OrganizationMemberRole[]>(ORGANIZATION_MEMBER_ROLES_KEY, context.getHandler());

      const request = context.switchToHttp().getRequest<Request>();

      // Get user id from JWT token
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token not provided');
      }
      const token = authHeader.split(' ')[1];
      const decoded = this.jwtService.verify(token);
      const userId = decoded.id;

      // Get organization id from request body
      const organizationId = request.body?.organization_id;
      if (!userId || !organizationId) {
        throw new UnauthorizedException('User ID or organization ID not provided');
      }

      const membership = await this.organizationMemberRepository.findOne({
        where: {
          user_id: userId,
          organization_id: organizationId,
        },
      });
      if (!membership) throw new ForbiddenException('User not part of organization');

      const roleHierarchy = [OrganizationMemberRole.VIEWER, OrganizationMemberRole.OPERATOR, OrganizationMemberRole.ADMIN];
      const userRoleIndex = roleHierarchy.indexOf(membership.role);
      const allowed = requiredRoles.some((role) => {
        const requiredIndex = roleHierarchy.indexOf(role);
        return userRoleIndex >= requiredIndex;
      });
      if (!allowed) {
        throw new ForbiddenException('User does not have the required role to access this resource');
      }

      return true;

    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      } else if (error.name === 'TokenExpiredError') {
        this.logger.error('User attempted login with expired token');
        throw new UnauthorizedException('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        this.logger.error('User attempted login with invalid token');
        throw new UnauthorizedException('Invalid token');
      } else if (error.code === '08006' || error.code === '08001') {
        this.logger.error(`Database connection error: ${error.message}`);
        throw new InternalServerErrorException('Database connection error');
      }

      this.logger.error(`Unexpected authentication error: ${error.stack}`);
      throw new UnauthorizedException('Authentication failed. Please check your credentials.');
    }
  }
}
