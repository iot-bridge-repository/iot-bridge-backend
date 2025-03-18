import { Injectable, CanActivate, Logger, ExecutionContext, UnauthorizedException, InternalServerErrorException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Request } from 'express';
import AuthenticatedRequest from './AuthenticatedRequest';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Ambil request dari context
    const request = context.switchToHttp().getRequest<Request>();
    // Ambil header Authorization
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token not provided');
    }
    const token = authHeader.split(' ')[1];

    try {
      const decoded = this.jwtService.verify(token);
      const { id, username } = decoded;
      const user = await this.userRepository.findOne({ where: { id, username } });
      if (!user) {
        this.logger.warn('User not found or token invalid');
        throw new UnauthorizedException('User not found or token invalid');
      }

      // Set user ke request
      (request as AuthenticatedRequest).user = { id, username };
      return true;
    } catch (error) {
      this.logger.warn(`Authentication failed: ${error.message}`);
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      } else if (error.name === 'TokenExpiredError') {
        this.logger.warn('User attempted login with expired token');
        throw new UnauthorizedException('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        this.logger.warn('User attempted login with invalid token');
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
