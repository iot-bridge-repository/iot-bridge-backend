import * as fs from 'fs';
import * as path from 'path';
import { Injectable, UnauthorizedException, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { PostLoginDto, PutUpdateProfileDto } from './dto';

@Injectable()
export class AuthApiService {
  private readonly logger = new Logger(AuthApiService.name);
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async postLogin(postLoginDto: PostLoginDto) {
    const user = await this.userRepository.findOne({ where: { email: postLoginDto.email } });
    if (!user || !bcrypt.compareSync(postLoginDto.password, user.password)) {
      this.logger.warn(`Login failed by email: ${postLoginDto.email}`);
      throw new UnauthorizedException('Email or password is incorrect');
    }

    const payload = { id: user.id, email: user.email, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

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
    this.logger.log(`User logged in: ${user.email}`);
    return response;
  }

  async getProfile(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.warn(`User not found by id: ${id}`);
      throw new UnauthorizedException('User not found');
    }

    const response = {
      message : "User profile retrieved successfully",
      data: { 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone_number: user.phone_number,
          profile_picture: user.profile_picture,
          role: user.role
        }
      },
    };
    this.logger.log(`User profile retrieved by id: ${user.id}`);
    return response;
  }

  async updateUserProfile( req: Request, id: string, updateProfileDto: PutUpdateProfileDto, profile_picture: string | null) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.warn(`User not found by id: ${id}`);
      throw new NotFoundException('User not found');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const updateDataProfile: Partial<User> = {
      username: updateProfileDto.username,
      email: updateProfileDto.email,
      phone_number: updateProfileDto.phone_number,
    };
    if (profile_picture) {
      updateDataProfile.profile_picture = `${baseUrl}/uploads/profile_pictures/${profile_picture}`;

      if (user.profile_picture) {
        const uploadDir = process.env.NODE_ENV === 'production'
          ? '/var/www/uploads/profile_pictures'
          : './uploads/profile_pictures';
        const oldFilePath = path.join(uploadDir, path.basename(user.profile_picture));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    await this.userRepository.update(id, updateDataProfile);

    const updatedUser = await this.userRepository.findOne({ where: { id } });
    const payload = { id: updatedUser!.id, email: updatedUser!.email, username: updatedUser!.username, role: updatedUser!.role };
    const token = this.jwtService.sign(payload);

    const response = {
      message : "Profile updated successfully",
      data: {
        token,
        user: {
          id: updatedUser!.id,
          username: updatedUser!.username,
          email: updatedUser!.email,
          phone_number: updatedUser!.phone_number,
          profile_picture: updatedUser!.profile_picture,
          role: updatedUser!.role
        }
      }
    };
    this.logger.log(`User profile updated by id: ${updatedUser!.id}`);
    return response;
  }
}
