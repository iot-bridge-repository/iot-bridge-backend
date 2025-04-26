import { Injectable, CanActivate, Logger, ExecutionContext, UnauthorizedException, InternalServerErrorException, HttpException, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import AuthenticatedRequest from '../interfaces/authenticated-request.interface';
import { USER_ROLES_KEY } from '../decorators/user-roles.decorator';
import { UserRole } from '../entities';

@Injectable()
export class UserRolesGuard implements CanActivate {
  private readonly logger = new Logger(UserRolesGuard.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Get request from context
      const request = context.switchToHttp().getRequest<Request>();
      // Get token from Authorization header
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        this.logger.warn('Token not provided');
        throw new UnauthorizedException('Token not provided');
      }
      const token = authHeader.split(' ')[1];

      // Verify token
      const decoded = this.jwtService.verify(token);

      // Add id and role to request object
      const { id, role } = decoded;
      (request as AuthenticatedRequest).user = { id, role };

      // Verify role
      const requiredRoles = this.reflector.get<UserRole>(USER_ROLES_KEY, context.getHandler());
      if (!requiredRoles) return true;
      const roleHierarchy = [UserRole.ADMIN_SYSTEM, UserRole.REGULAR_USER, UserRole.LOKAL_MEMBER];
      const hasAccess = [requiredRoles].some(requiredRole => roleHierarchy.indexOf(role) <= roleHierarchy.indexOf(requiredRole));
      if (!hasAccess) {
        this.logger.warn(`User with role ${role} tried to access ${context.getHandler().name} without sufficient permissions`);
        throw new UnauthorizedException('Insufficient role permissions');
      }
      return true;
    } catch (error) {
      this.logger.warn(`Authentication failed: ${error}`);

      if (error instanceof HttpException || error?.status || error?.response) throw error;
      if (error.name === 'TokenExpiredError') throw new UnauthorizedException('Token expired');
      if (error.name === 'JsonWebTokenError') throw new UnauthorizedException('Invalid token');
      if (['08006', '08001'].includes(error.code)) throw new InternalServerErrorException('Database error');

      throw new UnauthorizedException('Authentication failed. Please check your credentials.');
    }
  }
}
