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
import { User, VerifyEmailToken, ResetPasswordToken } from '../common/entities';
import * as dto from './dto';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class AuthApiService {
  private readonly logger = new Logger(AuthApiService.name);
  private readonly emailService: EmailService;
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(VerifyEmailToken) private readonly verifyEmailTokenRepository: Repository<VerifyEmailToken>,
    @InjectRepository(ResetPasswordToken) private readonly resetPasswordTokenRepository: Repository<ResetPasswordToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.emailService = new EmailService(this.configService);
  }

  private async checkExistingUserPostRegister(postRegisterDto: dto.PostRegisterDto) {
    const existingUser = await this.userRepository.findOne({
      select: {username: true, phone_number: true, email: true, is_email_verified: true, created_at: true},
      where: [
        { username: postRegisterDto.username },
        { email: postRegisterDto.email },
        { phone_number: postRegisterDto.phone_number },
      ],
    });

    if (existingUser) {
      if (existingUser.username === postRegisterDto.username) {
        this.logger.warn(`Failed to register. Username already exists: ${postRegisterDto.username}`);
        throw new BadRequestException('Username already exists');
      }
      if (existingUser.phone_number === postRegisterDto.phone_number) {
        this.logger.warn(`Failed to register. Phone number already exists: ${postRegisterDto.phone_number}`);
        throw new BadRequestException('Phone number already exists');
      }
      if (existingUser.email === postRegisterDto.email) {
        if (existingUser.is_email_verified) {
          this.logger.warn(`Failed to register. Email already exists: ${postRegisterDto.email}`);
          throw new BadRequestException('Email already exists');
        }
        const now = new Date();
        const expiredAt = new Date(existingUser.created_at);
        expiredAt.setHours(expiredAt.getHours() + 24);
        if (now < expiredAt) {
          this.logger.warn(`Failed to register. Email has been registered but not verified: ${postRegisterDto.email}`);
          throw new BadRequestException('Email has been registered but not verified. Please check your email and spam folder for the verification link.');
        }
        await this.verifyEmailTokenRepository.delete({ email: existingUser.email });
        await this.userRepository.delete({ email: existingUser.email });
      }
    }
  }

  private async checkExistingVerifyEmailTokenPostRegister(email: string) {
    const existingVerifyEmailToken = await this.verifyEmailTokenRepository.findOne({
      select: {email: true, created_at: true},
      where: { email },
    });

    if (existingVerifyEmailToken) {
      const now = new Date();
      const expiredAt = new Date(existingVerifyEmailToken.created_at);
      expiredAt.setHours(expiredAt.getHours() + 24);
      if (now < expiredAt) {
        this.logger.warn(`Failed to register. Email has been registered but not verified: ${email}`);
        throw new BadRequestException('Email has been registered but not verified. Please check your email and spam folder for the verification link.');
      }
      await this.verifyEmailTokenRepository.delete({ email: existingVerifyEmailToken.email });
      await this.userRepository.delete({ email: existingVerifyEmailToken.email });
    }
  }

  async postRegister(req: Request, postRegisterDto: dto.PostRegisterDto) {
    try {
      // Check if the user already exists
      await this.checkExistingUserPostRegister(postRegisterDto);
      // Check if the email already exists in verify email token table
      await this.checkExistingVerifyEmailTokenPostRegister(postRegisterDto.email);

      // Create a new user
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

      // Create a verification token
      const token = crypto.randomBytes(32).toString('hex');
      const verifyEmailToken = this.verifyEmailTokenRepository.create({
        id: uuidv4(),
        user_id: newUser.id,
        email: postRegisterDto.email,
        token,
        created_at: new Date(),
      });
      await this.verifyEmailTokenRepository.save(verifyEmailToken);

      // Send verify email link
      if (this.configService.get('NODE_ENV') !== 'staging') {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
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
                <a href="${baseUrl}/auth/verify-email/?token=${token}" 
                  style="
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #007bff;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 5px;
                    font-size: 16px;
                    font-weight: bold;
                    "
                >📧 Verifikasi Email</a>
              </div>
              <p>Setelah Anda memverifikasi alamat email ini, Anda dapat menggunakan alamat email, username, atau nomer telepon yang anda daftarkan untuk login ke akun <strong>IoT Bridge</strong>.</p>
              <p>Link verifikasi ini hanya berlaku selama <strong>24 jam</strong> dan hanya dapat digunakan <strong>1 kali</strong>. Jika Anda tidak melakukan pendaftaran, silakan abaikan email ini.</p>
              <p style="margin-top: 40px;">Salam hangat,<br><strong>Tim IoT Bridge</strong></p>
              <hr style="margin-top: 40px;">
              <p style="font-size: 12px; color: #999;">Email ini dikirim secara otomatis. Mohon untuk tidak membalas ke alamat ini.</p>
            </div>
          `
        );
      }

      this.logger.log(`Success to register, by email: ${postRegisterDto.email}`);
      const response: any = {
        message: "Check your email and spam folder for a link to verify your account.",
      };
      if (this.configService.get('NODE_ENV') === 'staging') {
        response.data = {
          verifyToken: token,
        };
      }
      return response;
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to register, by email: ${postRegisterDto.email}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to register, please try another time');
    }
  }

  async getVerifyEmail(queryToken: string, res: Response) {
    try {
      // Check if the token is exist and valid
      const verifyEmailToken = await this.verifyEmailTokenRepository.findOne({
        select: {user_id: true, created_at: true, email: true},
        where: { token: queryToken } 
      });
      if (!verifyEmailToken) {
        this.logger.warn(`Failed to verify email. Token not found: ${queryToken}`);
        throw new NotFoundException('Token not found');
      }

      // Check if the user exists
      const user = await this.userRepository.findOne({
        select: {is_email_verified: true},
        where: { id: verifyEmailToken.user_id } 
      });
      if (!user) {
        await this.verifyEmailTokenRepository.delete({user_id: verifyEmailToken.user_id});
        this.logger.warn(`Failed to verify email. User not found for verify email token: ${queryToken}`);
        throw new NotFoundException('User not found');
      }

      // Check if token is expired
      const now = new Date();
      const expiredAt = new Date(verifyEmailToken.created_at);
      expiredAt.setHours(expiredAt.getHours() + 24);
      if (now >= expiredAt) {
        await this.verifyEmailTokenRepository.delete({user_id: verifyEmailToken.user_id});
        // Check if the user is not verified
        if (!user.is_email_verified) {
          await this.userRepository.delete(verifyEmailToken.user_id);
        }
        this.logger.warn(`Failed to verify email. Email verification link expired for token: ${verifyEmailToken.token}`);
        throw new BadRequestException('Email verification link expired');
      }

      // Update the user to set email as verified and delete the token
      await this.userRepository.update(verifyEmailToken.user_id, { email: verifyEmailToken.email, is_email_verified: true });
      await this.verifyEmailTokenRepository.delete({token: queryToken});

      this.logger.log(`Success to verify email, for user with ID: ${verifyEmailToken.user_id}`);
      return res.render('get-verify-email');
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to verify email, by token: ${queryToken}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to verify email, please try another time');
    }
  }

  async postLogin(postLoginDto: dto.PostLoginDto) {
    try {
      // Check if the user exists
      const user = await this.userRepository.findOne({
        select: { id: true, is_email_verified: true, created_at: true, password: true, role: true },
        where: [
          { username: postLoginDto.identity },
          { email: postLoginDto.identity },
          { phone_number: postLoginDto.identity },
        ],
      });
      if (!user) {
        this.logger.warn(`Failed to login. User not found: ${postLoginDto.identity}`);
        throw new UnauthorizedException('Invalid identity');
      }

      // Check if the email is not verified
      if (!user.is_email_verified) {
        const now = new Date();
        const expiredAt = new Date(user.created_at);
        expiredAt.setHours(expiredAt.getHours() + 24);
        // Check if the email verification link is expired
        if (now >= expiredAt) {
          await this.verifyEmailTokenRepository.delete({ user_id: user.id });
          await this.userRepository.delete(user.id);
          this.logger.warn(`Failed to login. Email verification link expired for user ID: ${user.id}`);
          throw new BadRequestException('Email verification expired, please register again');
        }
        this.logger.warn(`Failed to login. Email not verified for identity: ${postLoginDto.identity}`);
        const timeRemaining = Math.ceil((expiredAt.getTime() - now.getTime()) / 1000 / 60); // dalam menit
        throw new UnauthorizedException(`Email not verified yet. Please verify your email within ${timeRemaining} minutes`);
      }

      // Check if the password is valid
      const isPasswordValid = await bcrypt.compare(postLoginDto.password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Failed to login. Invalid password for: ${postLoginDto.identity}`);
        throw new UnauthorizedException('Invalid password');
      }

      // Generate JWT token
      const payload = { id: user.id, role: user.role };
      const token = this.jwtService.sign(payload);

      this.logger.log(`User logged in successfully, by ID: ${user.id}`);
      return {
        message : "User logged in successfully.",
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
      this.logger.error(`Failed to login, by identity: ${postLoginDto.identity}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to login, please try another time');
    }
  }

  async postForgotPassword(req: Request, postForgotPasswordDto: dto.PostForgotPasswordDto) {
    try {
      // Check if the email exists
      const user = await this.userRepository.findOne({
        select: { email: true, is_email_verified: true, created_at: true, id: true, username: true },
        where: { email: postForgotPasswordDto.email } 
      });
      if (!user?.email) {
        this.logger.warn(`Failed to forgot password. Email not found or does not match: ${postForgotPasswordDto.email}`);
        throw new NotFoundException('Email not found');
      }

      // Check if the email is not verified
      if (!user.is_email_verified) {
        const now = new Date();
        const expiredAt = new Date(user.created_at);
        expiredAt.setHours(expiredAt.getHours() + 24);
        if (now >= expiredAt) {
          await this.verifyEmailTokenRepository.delete({ email: user.email });
          await this.userRepository.delete({ email: user.email });
          this.logger.warn(`Failed to forgot password. Email verification link expired for user with email: ${user.email}`);
          throw new BadRequestException('Email verification expired, please register again');
        }
        this.logger.warn(`Failed to forgot password. Email not verified for: ${postForgotPasswordDto.email}`);
        const timeRemaining = Math.ceil((expiredAt.getTime() - now.getTime()) / 1000 / 60); // dalam menit
        throw new UnauthorizedException(`Email not verified yet. Please verify your email first, within ${timeRemaining} minutes`);
      }

      // Check existing password reset token
      const existingResetPasswordToken = await this.resetPasswordTokenRepository.findOne({
        select: { id: true },
        where: { user_id: user.id } 
      });
      if (existingResetPasswordToken) {
        await this.resetPasswordTokenRepository.delete(existingResetPasswordToken.id);
      }

      // Create a new password reset token
      const token = crypto.randomBytes(32).toString('hex');
      const resetPasswordToken = this.resetPasswordTokenRepository.create({
        id: uuidv4(),
        user_id: user.id,
        token,
        created_at: new Date(),
      });
      await this.resetPasswordTokenRepository.save(resetPasswordToken);

      // Send password reset link via email
      if (this.configService.get('NODE_ENV') !== 'staging') {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        await this.emailService.sendEmail(
          user.email,
          '🔐 Permintaan Reset Password - IoT Bridge',
          `Halo ${user.username}`,
          `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; color: #333;">
              <h2 style="color: #007bff;">🔐 Permintaan Reset Password</h2>
              <p>Halo <strong>${user.username}</strong>,</p>
              <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda di <strong>IoT Bridge</strong>. Klik tombol di bawah ini untuk melanjutkan proses reset password:</p>
              <div style="margin: 20px 0;">
                <a href="${baseUrl}/auth/reset-password/${token}" 
                  style="
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #007bff;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 5px;
                    font-size: 16px;
                    font-weight: bold;
                  ">🔁 Atur Ulang Kata Sandi</a>
              </div>
              <p>Link reset password ini hanya berlaku selama <strong>1 jam</strong> dan hanya bisa digunakan satu kali.</p>
              <p>Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini. Akun Anda tetap aman.</p>
              <p style="margin-top: 40px;">Salam hangat,<br><strong>Tim IoT Bridge</strong></p>
              <hr style="margin-top: 40px;">
              <p style="font-size: 12px; color: #999;">Email ini dikirim secara otomatis. Mohon untuk tidak membalas ke alamat ini.</p>
            </div>
          `
        );
      }

      this.logger.log(`Success to forgot password, sent to email: ${postForgotPasswordDto.email}`);
      const response: any = {
        message: 'Check your email and spam folder for a link to reset your password.',
      };
      if (this.configService.get('NODE_ENV') === 'staging') {
        response.data = {
          resetPasswordToken: token,
        };
      }
      return response;
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to forgot password, by email: ${postForgotPasswordDto.email}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to forgot password, please try another time');
    }
  }

  async getResetPassword(req: Request, token: string, res: Response) {
    try {
      // Check if the token is exist and valid
      const resetPasswordToken = await this.resetPasswordTokenRepository.findOne({
        select: { created_at: true, user_id: true, id: true },
        where: { token: token }
      });
      if (!resetPasswordToken) {
        this.logger.warn(`Failed to get reset password. Token not found: ${token}`);
        throw new BadRequestException('Token is invalid');
      }
      const now = new Date();
      const expiredAt = new Date(resetPasswordToken.created_at);
      expiredAt.setHours(expiredAt.getHours() + 1);
      if (now >= expiredAt) {
        await this.resetPasswordTokenRepository.delete(resetPasswordToken.id);
        this.logger.warn(`Failed to get reset password. Reset password link expired for token: ${token}`);
        throw new BadRequestException('Reset password link expired, please try again');
      }

      this.logger.log(`Success to get reset password page, for user ID: ${resetPasswordToken.user_id}`);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return res.render('get-reset-password', {baseUrl, token})
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to get reset password, by token: ${token}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get reset password, please try another time');
    }
  }

  async postResetPassword(postResetPasswordDto: dto.PostResetPasswordDto, res: Response) {
    try {
      // Check if the token is exist and valid
      const resetPasswordToken = await this.resetPasswordTokenRepository.findOne({
        select: {created_at: true, id: true, user_id: true},
        where: { token: postResetPasswordDto.token } 
      });
      if (!resetPasswordToken) {
        this.logger.warn(`Failed to reset password. Token not found: ${postResetPasswordDto.token}`);
        throw new NotFoundException('Token not found');
      }
      const now = new Date();
      const expiredAt = new Date(resetPasswordToken.created_at);
      expiredAt.setHours(expiredAt.getHours() + 1);
      if (now >= expiredAt) {
        await this.resetPasswordTokenRepository.delete(resetPasswordToken.id);
        this.logger.warn(`Failed to reset password. Reset password link expired for token: ${postResetPasswordDto.token}`);
        throw new BadRequestException('Reset password link expired, please try again');
      }

      // Check if the user exists
      const user = await this.userRepository.findOne({
        select: { id: true },
        where: { id: resetPasswordToken.user_id } 
      });
      if (!user) {
        await this.resetPasswordTokenRepository.delete(resetPasswordToken.id);
        this.logger.error(`Failed to reset password. User not found for reset password token: ${postResetPasswordDto.token}`);
        throw new NotFoundException('User not found');
      }

      // Update the user password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(postResetPasswordDto.new_password, salt);
      await this.userRepository.update(user.id, { password: hashedPassword });

      // Delete the reset password token
      await this.resetPasswordTokenRepository.delete(resetPasswordToken.id);

      this.logger.log(`Success to reset password, by ID: ${resetPasswordToken.user_id}`);
      return res.render('post-reset-password')
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to reset password, by token: ${postResetPasswordDto.token}, Error: ${error}`);
      throw new InternalServerErrorException('Failed to reset password, please try another time');
    }
  }

  async getProfile(id: string) {
    try {
      // Check if the user exists
      const user = await this.userRepository.findOne({
        select: { id: true, username: true, email: true, phone_number: true, profile_picture: true, role: true },
        where: { id }
      });
      if (!user) {
        this.logger.warn(`Failed to get profile. User not found by id: ${id}`);
        throw new UnauthorizedException('User not found');
      }

      this.logger.log(`Success to get profile, by id: ${id}`);
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
      this.logger.error(`Failed to get profile, by id: ${id}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to get profile, please try another time');
    }
  }

  async patchProfile(req: Request, id: string, patchProfileDto: dto.PatchProfileDto, profile_picture: string | null) {
    try {
      // Check if the user exists
      const user = await this.userRepository.findOne({
        select: { profile_picture: true, email: true, role: true },
        where: { id }
      });
      if (!user) {
        this.logger.warn(`Failed to update profile. User not found by id: ${id}`);
        throw new UnauthorizedException('User not found');
      }

      // Check if the username and phone number already exist
      const checkDuplicate = async (field: keyof User, value: string, fieldName: string) => {
        const existing = await this.userRepository.findOne({ where: { [field]: value } });
        if (existing && existing.id !== id) {
          this.logger.warn(`Failed to update profile. ${fieldName} already exists: ${value}`);
          throw new BadRequestException(`${fieldName} already exists`);
        }
      };
      await checkDuplicate('username', patchProfileDto.username, 'Username');
      await checkDuplicate('phone_number', patchProfileDto.phone_number, 'Phone number');

      // User profile update data
      const updateDataProfile: Partial<User> = {
        username: patchProfileDto.username,
        phone_number: patchProfileDto.phone_number,
      };
      // Check if the profile picture is provided
      if (profile_picture) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        updateDataProfile.profile_picture = `${baseUrl}/uploads/profile_picture/${profile_picture}`;

        // Check if the old profile picture exists and delete it
        if (user.profile_picture) {
          const uploadDir = './uploads/profile_picture';
          const oldFilePath = path.join(uploadDir, path.basename(user.profile_picture));

          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      }

      // Update the user profile
      await this.userRepository.update(id, updateDataProfile);

      this.logger.log(`Success to update profile by id: ${id}`);
      return {
        message: 'Profile updated successfully.',
        data: {
          user: {
            id,
            username: updateDataProfile.username,
            email: user.email,
            phone_number: updateDataProfile.phone_number,
            profile_picture: updateDataProfile.profile_picture,
            role: user.role,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Failed to update profile by id: ${id}, Error: ${error.message}`);
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to update profile by id: ${id}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to update profile, please try another time');
    }
  }

  async patchEmail(req: Request, id: string, patchChangeEmailDto: dto.PatchEmailDto) {
    try {
      // Check if the user exists
      const user = await this.userRepository.findOne({
        select: { id: true, username: true },
        where: { id }
      });
      if (!user) {
        this.logger.error(`Failed to change email. User not found by id: ${id}`);
        throw new UnauthorizedException('User not found');
      }

      // Check if the new email is not duplicate in user table
      const existingEmail = await this.userRepository.findOne({
        select: { id: true },
        where: { email: patchChangeEmailDto.new_email }
      });
      if (existingEmail) {
        this.logger.warn(`Failed to change email. Email already exists: ${patchChangeEmailDto.new_email}`);
        throw new BadRequestException('Email already exists');
      }

      // Check if verify email token already exists in verify email token table
      const existingVerifyEmailToken = await this.verifyEmailTokenRepository.findOne({
        select: { email: true, user_id: true },
        where: [
          { email: patchChangeEmailDto.new_email },
          { user_id: user.id },
        ],
      });
      if (existingVerifyEmailToken?.email === patchChangeEmailDto.new_email) {
        this.logger.warn(`Failed to change email. Email already exists: ${patchChangeEmailDto.new_email}`);
        throw new BadRequestException('Email already exists, but not verified');
      }
      if (existingVerifyEmailToken?.user_id === user.id) {
        await this.verifyEmailTokenRepository.delete({ user_id: existingVerifyEmailToken.user_id });
      }

      // Create a verification token
      const token = crypto.randomBytes(32).toString('hex');
      const verifyEmailToken = this.verifyEmailTokenRepository.create({
        id: uuidv4(),
        user_id: user.id,
        email: patchChangeEmailDto.new_email,
        token,
        created_at: new Date(),
      });
      await this.verifyEmailTokenRepository.save(verifyEmailToken);

      // Send verify email link
      if (this.configService.get('NODE_ENV') !== 'staging') {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        await this.emailService.sendEmail(
          patchChangeEmailDto.new_email,
          '🔄 Verifikasi Email Baru Anda - IoT Bridge',
          `Halo ${user.username}`,
          `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; color: #333;">
            <h2 style="color: #007bff;">🔄 Verifikasi Alamat Email Baru Anda</h2>
            <p>Halo <strong>${user.username}</strong>,</p>
            <p>Anda telah mengajukan permintaan untuk mengganti alamat email akun <strong>IoT Bridge</strong> Anda ke:</p>
            <p style="font-size: 16px; font-weight: bold;">📧 ${patchChangeEmailDto.new_email}</p>
            <p>Untuk menyelesaikan perubahan ini, silakan klik tombol di bawah ini untuk memverifikasi alamat email baru:</p>
            <div style="margin: 20px 0;">
              <a href="${baseUrl}/auth/verify-email?token=${token}" style="
                display: inline-block;
                padding: 12px 24px;
                background-color: #007bff;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;
              ">✅ Verifikasi Email Baru</a>
            </div>
            <p>Link ini hanya berlaku selama <strong>24 jam</strong>. Jika Anda tidak mengajukan permintaan ini, abaikan saja email ini dan perubahan tidak akan dilakukan.</p>
            <p style="margin-top: 40px;">Salam hangat,<br><strong>Tim IoT Bridge</strong></p>
            <hr style="margin-top: 40px;">
            <p style="font-size: 12px; color: #999;">Email ini dikirim secara otomatis. Mohon untuk tidak membalas ke alamat ini.</p>
          </div>
          `
        );
      }

      this.logger.log(`Success to changed email by id: ${id}`);
      const response: any = {
        message: "Check your email and spam folder for a link to verify your new email.",
      };
      if (this.configService.get('NODE_ENV') === 'staging') {
        response.data = {
          verifyToken: token,
        };
      }
      return response;
    } catch (error) {
      if (error instanceof HttpException || error?.status || error?.response) {
        throw error;
      }
      this.logger.error(`Failed to change email by id: ${id}, Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to change email, please try again later');
    }
  }

  async patchPassword(id: string, patchPasswordDto: dto.PatchPasswordDto) {
    try {
      // Check if the user exists
      const user = await this.userRepository.findOne({
        select: { password: true },
        where: { id }
      });
      if (!user) {
        this.logger.warn(`Failed to change password. User not found by id: ${id}`);
        throw new UnauthorizedException('User not found');
      }

      const { old_password, new_password } = patchPasswordDto;

      // Check if the old password is valid
      const isPasswordValid = await bcrypt.compare(old_password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Failed to change password. Incorrect old password by id: ${id}`);
        throw new BadRequestException('Incorrect old password');
      }

      // Update the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);
      await this.userRepository.update(id, { password: hashedPassword });

      this.logger.log(`Success to change password by id: ${id}`);
      return {
        message: 'Password changed successfully.',
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
