import * as fs from 'fs';
import * as path from 'path';
import { Injectable, UnauthorizedException, Logger, NotFoundException, BadRequestException, InternalServerErrorException, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from "uuid";
import { User } from '../common/entities';
import * as dto from './dto';
import { EmailService } from '../common/services/email.service';

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

  async postRegister(postRegisterDto: dto.PostRegisterDto) {
    try {
      const existingUser = await this.userRepository.findOne({
        where: [
          { username: postRegisterDto.username },
          { email: postRegisterDto.email },
          { phone_number: postRegisterDto.phone_number },
        ],
      });
      if (existingUser?.is_email_verified === true) {
        if (existingUser.username === postRegisterDto.username) {
          throw new BadRequestException('Username already exists');
        }
        if (existingUser.email === postRegisterDto.email) {
          throw new BadRequestException('Email already exists');
        }
        if (existingUser.phone_number === postRegisterDto.phone_number) {
          throw new BadRequestException('Phone number already exists');
        }
      } else if (existingUser?.is_email_verified === false) {
        const now = new Date();
        const expiredAt = new Date(existingUser.created_at);
        expiredAt.setHours(expiredAt.getHours() + 24);
        if (now < expiredAt) {
          throw new BadRequestException('Email has been registered but not verified. Please check your email for the verification link.');
        } else if (now >= expiredAt) {
          await this.userRepository.delete(existingUser.id);
        }
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(postRegisterDto.password, salt);
      const newUser = this.userRepository.create({
        id: uuidv4(),
        username: postRegisterDto.username,
        email: postRegisterDto.email,
        phone_number: postRegisterDto.phone_number,
        password: hashedPassword,
        is_email_verified: false,
      });
      await this.userRepository.save(newUser);

      const baseUrl = this.configService.get('NODE_ENV') === 'production'
        ? 'https://api.iotbridge.app'
        : 'http://localhost:3000';
      await this.emailService.sendEmail(
        postRegisterDto.email,
        '🔒 Verifikasi Akun Anda - IoT Bridge',
        `Halo ${postRegisterDto.username}`,
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; color: #333;">
            <h2 style="color: #007bff;">🔒 Verifikasi Email Anda</h2>
            <p>Halo <strong>${postRegisterDto.username}</strong>,</p>
            <p>Terima kasih telah mendaftar di <strong>IoT Bridge</strong>. Untuk mengaktifkan akun Anda, silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda:</p>
            <div style="margin: 20px 0;">
              <a href="${baseUrl}/auth/verify-email/?id=${newUser.id}" style="
                display: inline-block;
                padding: 12px 24px;
                background-color: #007bff;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;
              ">
                Verifikasi Email
              </a>
            </div>
            <p>Link verifikasi ini hanya berlaku selama <strong>24 jam</strong>. Jika Anda tidak melakukan pendaftaran, silakan abaikan email ini.</p>
            <p style="margin-top: 40px;">Salam hangat,<br><strong>Tim IoT Bridge</strong></p>
            <hr style="margin-top: 40px;">
            <p style="font-size: 12px; color: #999;">Email ini dikirim secara otomatis. Mohon untuk tidak membalas ke alamat ini.</p>
          </div>
        `
      );

      this.logger.log(`User registered by email: ${postRegisterDto.email}`);
      return {
        message: "Check your email and spam folder for a link to verify your account.",
      };
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to register by email: ${postRegisterDto.email}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to register, please try another time');
    }
  }

  async getVerifyEmail(id: string, res: Response) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.warn(`Verify email failed. Id not found: ${id}`);
        throw new UnauthorizedException('Invalid id');
      }
      if (user.is_email_verified) {
        this.logger.warn(`Email already verified for user ID: ${id}`);
        throw new BadRequestException('Email already verified');
      }
      const now = new Date();
      const expiredAt = new Date(user.created_at);
      expiredAt.setHours(expiredAt.getHours() + 24);
      if (now >= expiredAt) {
        await this.userRepository.delete(id);
        this.logger.warn(`Email verification link expired for user ID: ${id}`);
        throw new BadRequestException('Email verification link expired, please register again');
      }

      await this.userRepository.update(id, { is_email_verified: true });

      this.logger.log(`Email verified successfully for user ID: ${id}`);
      return res.status(200).send(`
        <html>
          <head>
            <title>Verifikasi Berhasil - IoT Bridge</title>
          </head>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); max-width: 500px; margin: auto;">
              <h2 style="color: #28a745;">✅ Verifikasi Email Berhasil!</h2>
              <p style="font-size: 16px; color: #333;">
                Selamat! Akun Anda di <strong>IoT Bridge</strong> telah berhasil diverifikasi.
              </p>
              <p style="font-size: 16px; color: #333;">
                Silakan kembali ke halaman login untuk mulai menggunakan aplikasi kami.
              </p>
              <p style="margin-top: 30px; font-size: 14px; color: #888;">
                © 2025 IoT Bridge. Semua hak dilindungi.
              </p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to verify email by id: ${id}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to login, please try another time');
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

      if (!user.is_email_verified) {
        const now = new Date();
        const expiredAt = new Date(user.created_at);
        expiredAt.setHours(expiredAt.getHours() + 24);
        if (now >= expiredAt) {
          await this.userRepository.delete(user.id);
          this.logger.warn(`Email verification link expired for user ID: ${user.id}`);
          throw new BadRequestException('Email verification expired, please register again');
        }

        this.logger.warn(`Login failed. Email not verified for: ${postLoginDto.identity}`);
        const timeRemaining = Math.ceil((expiredAt.getTime() - now.getTime()) / 1000 / 60); // dalam menit
        throw new UnauthorizedException(`Email not verified yet. Please verify your email within ${timeRemaining} minutes`);
      }
      
      const isPasswordValid = await bcrypt.compare(postLoginDto.password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Login failed. Invalid password for: ${postLoginDto.identity}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { id: user.id, role: user.role };
      const token = this.jwtService.sign(payload);

      this.logger.log(`User logged in: ${user.email}`);
      return {
        message : "User logged in successfully",
        data: { 
          token,
          user: {
            id: user.id,
            role: user.role,
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

      const checkDuplicate = async (field: keyof User, value: string, fieldName: string) => {
        const existing = await this.userRepository.findOne({ where: { [field]: value } });
        if (existing && existing.id !== id) {
          this.logger.warn(`${fieldName} already exists: ${value}`);
          throw new BadRequestException(`${fieldName} already exists`);
        }
      };
      await checkDuplicate('username', updateProfileDto.username, 'Username');
      await checkDuplicate('phone_number', updateProfileDto.phone_number, 'Phone number');

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

      await this.userRepository.update(id, { email: changeEmailDto.email });

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
