import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto';

@Injectable()
export class AuthApiService {
  private readonly logger = new Logger(AuthApiService.name);
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { email: loginDto.email } });

    if (!user || !bcrypt.compareSync(loginDto.password, user.password)) {
      this.logger.warn(`Login failed: ${loginDto.email}`);
      throw new UnauthorizedException('Email atau password salah');
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    this.logger.log(`User logged in: ${user.email}`);
    const response = {
      message : "User logged in successfully",
      data: { 
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      },
    };
    return response;
  }
}
