import * as fs from 'fs';
import * as path from 'path';
import { Injectable, UnauthorizedException, Logger, NotFoundException, BadRequestException, InternalServerErrorException, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { PostLoginDto, PutUpdateProfileDto, PutChangePasswordDto, PostForgotPasswordDto } from './dto';
import { EmailService } from '../services/email.service';

@Injectable()
export class AuthApiService {
  private readonly logger = new Logger(AuthApiService.name);
  private readonly emailService: EmailService;
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.emailService = new EmailService(this.configService);
  }

  async postLogin(postLoginDto: PostLoginDto) {
    try {
      const user = await this.userRepository.findOne({ where: { email: postLoginDto.email } });
      if (!user || !bcrypt.compareSync(postLoginDto.password, user.password)) {
        this.logger.warn(`Login failed by email: ${postLoginDto.email}`);
        throw new UnauthorizedException('Email or password is incorrect');
      }

      const payload = { id: user.id, email: user.email, username: user.username, role: user.role };
      const token = this.jwtService.sign(payload);

      this.logger.log(`User logged in: ${user.email}`);
      return {
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
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to login by email: ${postLoginDto.email}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to login, please try another time');
    }
  }

  async postForgotPassword(postForgotPasswordDto: PostForgotPasswordDto) {
    try {
      const user = await this.userRepository.findOne({ where: { email: postForgotPasswordDto.email, phone_number: postForgotPasswordDto.phone_number } });
      if (!user) {
        this.logger.warn(`Email or phone number not found or does not match: ${postForgotPasswordDto.email}, ${postForgotPasswordDto.phone_number}`);
        throw new NotFoundException('Email or phone number not found or does not match');
      }

      const newPassword = crypto
        .randomBytes(8)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 8);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      user.password = hashedPassword;
      await this.userRepository.save(user);

      await this.emailService.sendEmail(
        user.email,
        '🔒 Reset Password Akun Anda',
        `Halo ${user.username},\n\nKami telah menerima permintaan reset password untuk akun Anda. Berikut adalah password baru Anda:\n\n🔑 Password Baru: ${newPassword}\n\nHarap segera login dan ubah password Anda untuk keamanan akun.\n\nJika Anda tidak meminta reset password ini, abaikan email ini atau hubungi tim support kami.\n\nSalam,\nIoT Bridge Team`,
        `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🔒 Reset Password Akun Anda</h2>
          <p>Halo <strong>${user.username}</strong>,</p>
          <p>Kami telah menerima permintaan reset password untuk akun Anda.</p>
          <p><strong>🔑 Password Baru:</strong> <code>${newPassword}</code></p>
          <p>Harap segera login dan ubah password Anda untuk menjaga keamanan akun.</p>
          <p>Jika Anda tidak meminta reset password ini, abaikan email ini atau hubungi tim support kami.</p>
          <hr>
          <p>Salam,<br><strong>IoT Bridge Team</strong></p>
        </div>
        `
      );

      this.logger.log(`New password sent to email: ${postForgotPasswordDto.email}`);
      return { message: 'A new password has been sent to your email' };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to send email forgot password by email: ${postForgotPasswordDto.email}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to send email forgot password, please try another time');
    }
  }

  async getProfile(id: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.warn(`User not found by id: ${id}`);
        throw new UnauthorizedException('User not found');
      }

      this.logger.log(`User profile retrieved by id: ${id}`);
      return {
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
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to login by id: ${id}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get profile, please try another time');
    }
  }

  async updateUserProfile(req: Request, id: string, updateProfileDto: PutUpdateProfileDto, profile_picture: string | null) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.warn(`User not found by id: ${id}`);
        throw new NotFoundException('User not found');
      }

      const updateDataProfile: Partial<User> = {
        username: updateProfileDto.username,
        email: updateProfileDto.email,
        phone_number: updateProfileDto.phone_number,
      };
      if (profile_picture) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        updateDataProfile.profile_picture = `${baseUrl}/uploads/profile_pictures/${profile_picture}`;

        if (user.profile_picture) {
          const uploadDir = this.configService.get('NODE_ENV') === 'production'
            ? '/var/www/uploads/profile_pictures'
            : './uploads/profile_pictures';
          const oldFilePath = path.join(uploadDir, path.basename(user.profile_picture));

          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      }

      await this.userRepository.update(id, updateDataProfile);

      const payload = {
        id,
        email: updateDataProfile.email,
        username: updateDataProfile.username,
        role: updateDataProfile.role,
      };
      const token = this.jwtService.sign(payload);

      this.logger.log(`User profile updated by id: ${id}`);
      return {
        message: 'Profile updated successfully',
        data: {
          token,
          user: {
            id,
            username: updateDataProfile.username,
            email: updateDataProfile.email,
            phone_number: updateDataProfile.phone_number,
            profile_picture: updateDataProfile.profile_picture,
            role: updateDataProfile.role,
          },
        },
      };
    } catch (error) {
      this.logger.warn(`Failed to update profile by id: ${id}, Error: ${error.message}`);
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      } else if (error.code === '23505') { // PostgreSQL Unique Constraint Violation
        throw new BadRequestException('Email, username, or phone number is already taken');
      } else if (error.code === '22P02') { // PostgreSQL Invalid Text Representation (misalnya input string ke integer)
        throw new BadRequestException('Invalid input: Please check your data format');
      }
      this.logger.error(`Failed to update profile by id: ${id}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to update profile, please try another time');
    }
  }

  async changePassword(id: string, changePasswordDto: PutChangePasswordDto) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.warn(`User not found by id: ${id}`);
        throw new NotFoundException('User not found');
      }

      const { oldPassword, newPassword } = changePasswordDto;

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Incorrect old password by id: ${id}`);
        throw new BadRequestException('Incorrect old password');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userRepository.update(id, { password: hashedPassword });

      this.logger.log(`Password changed by id: ${id}`);
      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to change password by id: ${id}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to change password, please try another time');
    }
  }
}
