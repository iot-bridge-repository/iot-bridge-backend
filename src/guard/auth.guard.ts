import { CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '../entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export class AuthGuard implements CanActivate {
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
      const { id, email, username, role } = decoded;
      const user = await this.userRepository.findOne({ where: { id, email, username, role } });
      if (!user) {
        throw new UnauthorizedException('User not found or token invalid');
      }

      // Set user ke request
      (request as AuthenticatedRequest).user = { id, email, username, role };
      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
