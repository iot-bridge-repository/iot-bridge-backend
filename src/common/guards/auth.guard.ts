import { Injectable, CanActivate, Logger, ExecutionContext, UnauthorizedException, InternalServerErrorException, HttpException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { checkToken } from '../utils/check-token.util';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<Request>();
      await checkToken(request, this.jwtService, this.logger);
      return true;
    } catch (error) {
      this.logger.warn(`Authentication failed: ${error.message}`);

      if (error instanceof HttpException || error?.status || error?.response) throw error;
      if (error.name === 'TokenExpiredError') throw new UnauthorizedException('Token expired');
      if (error.name === 'JsonWebTokenError') throw new UnauthorizedException('Invalid token');
      if (['08006', '08001'].includes(error.code)) throw new InternalServerErrorException('Database error');

      throw new UnauthorizedException('Authentication failed. Please check your credentials.');
    }
  }
}
