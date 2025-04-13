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
import { v4 as uuidv4 } from "uuid";
import { Otp, User } from '../common/entities';
import * as dto from './dto';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class AuthApiService {
  private readonly logger = new Logger(AuthApiService.name);
  private readonly emailService: EmailService;
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Otp) private readonly otpRepository: Repository<Otp>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.emailService = new EmailService(this.configService);
  }

  async postEmailOtp(postEmailOtpDto: dto.PostEmailOtpDto) {
    try {
      const existingOtp = await this.otpRepository.findOneBy({ email: postEmailOtpDto.email });
      if (existingOtp) {
        await this.otpRepository.remove(existingOtp);
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await this.emailService.sendEmail(
        postEmailOtpDto.email,
        '🔒 Email OTP Akun IoT Bridge Anda',
        `Halo, berikut adalah Email OTP untuk akun IoT Bridge Anda: ${otp}. Email OTP ini berlaku selama 5 menit.`,
        `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🔒 Email OTP Akun IoT Bridge Anda</h2>
          <p>Halo,</p>
          <p>Berikut adalah Email OTP untuk akun IoT Bridge Anda:</p>
          <h3 style="color: #007bff;">${otp}</h3>
          <p>Email OTP ini berlaku selama 5 menit.</p>
          <hr>
          <p>Salam,<br><strong>IoT Bridge Team</strong></p>
        </div>
        `
      )

      await this.otpRepository.save({
        email: postEmailOtpDto.email,
        otp,
        type: 'email',
        created_at: new Date(),
      });

      this.logger.log(`Email OTP sent successfully to email: ${postEmailOtpDto.email}`);
      return { message: 'Email OTP sent successfully, please check your email or spam folder' };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to send email forgot password by email: ${postEmailOtpDto.email}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to send email forgot password, please try another time');
    }
  }

  async postRegister(postRegisterDto: dto.PostRegisterDto) {
    try {
      const existingEmail = await this.userRepository.findOne({ where: { email: postRegisterDto.email } });
      if (existingEmail) {
        this.logger.warn(`Email already exists: ${postRegisterDto.email}`);
        throw new BadRequestException('Email already exists');
      }
      const existingUsername = await this.userRepository.findOne({ where: { username: postRegisterDto.username } });
      if (existingUsername) {
        this.logger.warn(`Username already exists: ${postRegisterDto.username}`);
        throw new BadRequestException('Username already exists');
      }
      const existingPhoneNumber = await this.userRepository.findOne({ where: { phone_number: postRegisterDto.phone_number } });
      if (existingPhoneNumber) {
        this.logger.warn(`Phone number already exists: ${postRegisterDto.phone_number}`);
        throw new BadRequestException('Phone number already exists');
      }

      const existingOtp = await this.otpRepository.findOne({ where: { email: postRegisterDto.email } });
      if (!existingOtp) {
        this.logger.warn(`No OTP found for email: ${postRegisterDto.email}`);
        throw new NotFoundException('OTP not found for this email');
      }
      if (existingOtp.otp !== postRegisterDto.otp) {
        this.logger.warn(`Invalid OTP for email: ${postRegisterDto.email}`);
        throw new BadRequestException('Invalid OTP code');
      }
      const createdAt = new Date(existingOtp.created_at);
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 menit
      if (createdAt < fiveMinutesAgo) {
        this.logger.warn(`OTP expired (created_at: ${createdAt.toISOString()}) for email: ${postRegisterDto.email}`);
        await this.otpRepository.remove(existingOtp);
        throw new BadRequestException('OTP has expired');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(postRegisterDto.password, salt);
      const newUser = this.userRepository.create({
        id: uuidv4(),
        email: postRegisterDto.email,
        phone_number: postRegisterDto.phone_number,
        username: postRegisterDto.username,
        password: hashedPassword,
      });
      await this.userRepository.save(newUser);
      await this.otpRepository.remove(existingOtp);

      const payload = { id: newUser.id };
      const token = this.jwtService.sign(payload);

      this.logger.log(`User registered successfully by email: ${postRegisterDto.email}`);
      return {
        message: "User registered successfully",
        data: {
          token,
          user: {
            id: newUser.id,
          },
        },
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to register by email: ${postRegisterDto.email}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to register, please try another time');
    }
  }

  async postLogin(postLoginDto: dto.PostLoginDto) {
    try {
      const user = await this.userRepository.findOne({
        where: [
          { username: postLoginDto.identity },
          { email: postLoginDto.identity },
          { phone_number: postLoginDto.identity },
        ],
      });
      if (!user) {
        this.logger.warn(`Login failed. User not found: ${postLoginDto.identity}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(postLoginDto.password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Login failed. Invalid password for: ${postLoginDto.identity}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { id: user.id };
      const token = this.jwtService.sign(payload);

      this.logger.log(`User logged in: ${user.email}`);
      return {
        message : "User logged in successfully",
        data: { 
          token,
          user: {
            id: user.id,
          }
        },
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to login by identity: ${postLoginDto.identity}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to login, please try another time');
    }
  }

  async postForgotPassword(postForgotPasswordDto: dto.PostForgotPasswordDto) {
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
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

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

  async updateUserProfile(id: string, updateProfileDto: dto.PutUpdateProfileDto, profile_picture: string | null, req: Request) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.warn(`User not found by id: ${id}`);
        throw new UnauthorizedException('User not found');
      }

      const existingUsername = await this.userRepository.findOne({ where: { username: updateProfileDto.username } });
      if (existingUsername && existingUsername.id !== id) {
        this.logger.warn(`Username already exists: ${updateProfileDto.username}`);
        throw new BadRequestException('Username already exists');
      }
      const existingPhoneNumber = await this.userRepository.findOne({ where: { phone_number: updateProfileDto.phone_number } });
      if (existingPhoneNumber && existingPhoneNumber.id !== id) {
        this.logger.warn(`Phone number already exists: ${updateProfileDto.phone_number}`);
        throw new BadRequestException('Phone number already exists');
      }

      const updateDataProfile: Partial<User> = {
        username: updateProfileDto.username,
        phone_number: updateProfileDto.phone_number,
      };
      if (profile_picture) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        updateDataProfile.profile_picture = `${baseUrl}/uploads/profile_picture/${profile_picture}`;

        if (user.profile_picture) {
          const uploadDir = this.configService.get('NODE_ENV') === 'production'
            ? '/var/www/uploads/profile_picture'
            : './uploads/profile_picture';
          const oldFilePath = path.join(uploadDir, path.basename(user.profile_picture));

          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      }

      await this.userRepository.update(id, updateDataProfile);

      this.logger.log(`User profile updated by id: ${id}`);
      return {
        message: 'Profile updated successfully',
        data: {
          user: {
            id,
            username: updateDataProfile.username,
            email: user.email,
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
      }
      this.logger.error(`Failed to update profile by id: ${id}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to update profile, please try another time');
    }
  }

  async changeEmail(id: string, changeEmailDto: dto.PutChangeEmailDto) {
    try {  
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.warn(`User not found by id: ${id}`);
        throw new UnauthorizedException('User not found');
      }

      const existingEmail = await this.userRepository.findOne({ where: { email: changeEmailDto.email } });
      if (existingEmail) {
        this.logger.warn(`Email already exists: ${changeEmailDto.email}`);
        throw new BadRequestException('Email already exists');
      }

      const existingOtp = await this.otpRepository.findOne({ where: { email: changeEmailDto.email } });
      if (!existingOtp) {
        this.logger.warn(`No OTP found for email: ${changeEmailDto.email}`);
        throw new NotFoundException('OTP not found for this email');
      }
      if (existingOtp.otp !== changeEmailDto.otp) {
        this.logger.warn(`Invalid OTP for email: ${changeEmailDto.email}`);
        throw new BadRequestException('Invalid OTP code');
      }
      const createdAt = new Date(existingOtp.created_at);
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 menit
      if (createdAt < fiveMinutesAgo) {
        this.logger.warn(`OTP expired (created_at: ${createdAt.toISOString()}) for email: ${changeEmailDto.email}`);
        await this.otpRepository.remove(existingOtp);
        throw new BadRequestException('OTP has expired');
      }

      await this.userRepository.update(id, { email: changeEmailDto.email });
      await this.otpRepository.remove(existingOtp);

      this.logger.log(`Email updated successfully for user ID: ${id}`);
      return {
        message: 'Email changed successfully',
        data: {
          user: {
            email: changeEmailDto.email,
          },
        },
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to change email by id: ${id}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to change email, please try again later');
    }
  }

  async changePassword(id: string, changePasswordDto: dto.PutChangePasswordDto) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.warn(`User not found by id: ${id}`);
        throw new UnauthorizedException('User not found');
      }

      const { oldPassword, newPassword } = changePasswordDto;

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Incorrect old password by id: ${id}`);
        throw new BadRequestException('Incorrect old password');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
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
