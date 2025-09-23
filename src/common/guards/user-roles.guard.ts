import { Injectable, CanActivate, Logger, ExecutionContext, UnauthorizedException, InternalServerErrorException, HttpException, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import AuthenticatedRequest from '../interfaces/authenticated-request.interface';
import { USER_ROLES_KEY } from '../decorators/user-roles.decorator';
import { UserRole } from '../entities';
import { checkToken } from '../utils/check-token.util';

@Injectable()
export class UserRolesGuard implements CanActivate {
  private readonly logger = new Logger(UserRolesGuard.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Check token from Authorization header
      const request = context.switchToHttp().getRequest<Request>();
      await checkToken(request, this.jwtService, this.logger);

      // Get required role
      const requiredRole = this.reflector.get<UserRole>(USER_ROLES_KEY, context.getHandler());
      if (!requiredRole) return true;

      // Get user role from request
      const { role } = (request as AuthenticatedRequest).user;

      // Verify role
      const roleHierarchy = [UserRole.ADMIN_SYSTEM, UserRole.REGULAR_USER, UserRole.LOCAL_MEMBER];
      const hasAccess = [requiredRole].some(requiredRole => roleHierarchy.indexOf(role) <= roleHierarchy.indexOf(requiredRole));
      if (!hasAccess) {
        this.logger.warn(`User roles guard: User with role ${role} tried to access ${context.getHandler().name} without sufficient permissions`);
        throw new UnauthorizedException(`Insufficient role permissions, only user with minimum role ${requiredRole} can access this resource`);
      }
      return true;
    } catch (error) {
      this.logger.warn(`User roles guard: Authentication failed: ${error}`);

      if (error instanceof HttpException || error?.status || error?.response) throw error;
      if (error.name === 'TokenExpiredError') throw new UnauthorizedException('Token expired');
      if (error.name === 'JsonWebTokenError') throw new UnauthorizedException('Invalid token');
      if (['08006', '08001'].includes(error.code)) throw new InternalServerErrorException('Database error');

      throw new UnauthorizedException('Authentication failed. Please check your credentials.');
    }
  }
}
