import { Injectable, CanActivate, Logger, ExecutionContext, UnauthorizedException, InternalServerErrorException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Request } from 'express';
import AuthenticatedRequest from '../interfaces/authenticated-request.interface';
import { User, UserRole } from '../entities';

@Injectable()
export class AdminSystemGuard implements CanActivate {
  private readonly logger = new Logger(AdminSystemGuard.name);
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Get request from context
      const request = context.switchToHttp().getRequest<Request>();
      // Get Authorization header
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token not provided');
      }
      const token = authHeader.split(' ')[1];

      // Verify token
      const decoded = this.jwtService.verify(token);

      // Verify id and role
      const { id, role } = decoded;
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.error('User not found or token invalid');
        throw new UnauthorizedException('User not found or token invalid');
      } else if (user.role !== UserRole.ADMIN_SYSTEM && role !== UserRole.ADMIN_SYSTEM) {
        this.logger.error('User not authorized to access, only Admin System can access');
        throw new UnauthorizedException('You are not authorized to access, only Admin System can access');
      }

      // Set user to request
      (request as AuthenticatedRequest).user = { id, role };
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
