import { Controller, Logger, UseGuards, Req, Res, Body, Query, Post, Get, Put, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthApiService } from './auth-api.service';
import * as dto from './dto';
import { AuthGuard } from '../common/guards/auth.guard';
import AuthenticatedRequest from '../common/interfaces/authenticated-request.interface';
import { UploadPictureInterceptorFactory } from '../common/interceptors/upload-picture.interceptor';

@ApiTags('Auth')
@Controller('auth')
export class AuthApiController {
  private readonly logger = new Logger(AuthApiController.name);
  constructor(
    private readonly authService: AuthApiService, 
  ) {}

  @ApiOperation({ summary: 'Register' })
  @ApiOkResponse({
    description: 'User get email verification link',
    schema: {
      example: {
        message: "Check your email and spam folder for a link to verify your account.",
      }
    }
  })
  @Post('register')
  async postRegister(@Body() postRegisterDto: dto.PostRegisterDto) {
    this.logger.log(`There is a register request`);
    return this.authService.postRegister(postRegisterDto);
  }

  @ApiOperation({ summary: 'Verification email' })
  @ApiOkResponse({
    description: 'Returns an HTML page confirming successful email verification',
    content: {
      'text/html': {
        example: `
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
        `,
      },
    },
  })
  @Get('verify-email')
  async getVerifyEmail(@Res() res: Response, @Query('id') id: string) {
    this.logger.log(`There is a verify email request`);
    return this.authService.getVerifyEmail(id, res);
  }

  @ApiOperation({ summary: 'Login' })
  @ApiOkResponse({ 
    description: 'User logged in successfully', 
    schema: { 
      example: { 
        message: 'User logged in successfully', 
        data: { 
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZmMmQ2ZTE2LTdiMTAtNDZhOC04ZWI2LWY0YzliMTg0YWM4OSIsImlhdCI6MTc0NDIyNDI2NX0.E2IqEjRvdHK26vN32vLauC1amGT0evpee_sBPGw25G0', 
          user: { 
            id: 'c353a34c-2aad-44c4-8830-796360c16d2e', 
          } 
        } 
      } 
    }  
  })
  @Post('login')
  async postLogin(@Body() postLoginDto: dto.PostLoginDto) {
    this.logger.log(`There is a login request`);
    return this.authService.postLogin(postLoginDto);
  }

  @ApiOperation({ summary: 'Forgot password' })
  @ApiOkResponse({
    description: 'Forgot password request sent successfully',
    schema: {
      example: {
        message: 'A new password has been sent to your email'
      }
    }
  })
  @Post('forgot-password')
  async postForgotPassword(@Body() PostForgotPasswordDto: dto.PostForgotPasswordDto) {
    this.logger.log(`There is a forgot password request`);
    return this.authService.postForgotPassword(PostForgotPasswordDto);
  }

  @ApiOperation({ summary: 'Get profile' })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        message: 'User profile retrieved successfully',
        data: {
          user: {
            id: 'c353a34c-2aad-44c4-8830-796360c16d2e',
            username: 'Bill Valentinov',
            email: 'user@example.com',
            phone_number: '08xx-xxxx-xxxx',
            profile_picture: 'https://example.com/profile-picture.jpg',
            role: 'Admin System'
          }
        }
      }
    }
  })
  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Req() request: AuthenticatedRequest) {
    return this.authService.getProfile(request.user.id);
  }

  @ApiOperation({ summary: 'Update profile' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'username' },
        phone_number: { type: 'string', example: '08xxxxxxxxx' },
        profile_picture: { type: 'string', format: 'binary', description: '(optional)' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    schema: {
      example: {
        message: 'Profile updated successfully',
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c', 
          user: {
            id: 'c353a34c-2aad-44c4-8830-796360c16d2e',
            username: 'Bill Valentinov',
            email: 'user@example.com',
            phone_number: '08xx-xxxx-xxxx',
            profile_picture: 'https://example.com/profile-picture.jpg',
            role: 'Admin System'
          }
        }
      }
    }
  })
  @Put('update-profile')
  @UseGuards(AuthGuard)
  @UseInterceptors(UploadPictureInterceptorFactory('profile_picture'))
  async putUpdateProfile(@Req() request: AuthenticatedRequest, @Body() putUpdateProfileDto: dto.PutUpdateProfileDto) {
    this.logger.log(`There is an update profile request`);
    return this.authService.updateUserProfile(request.user.id, putUpdateProfileDto, request.file?.filename ?? null, request);
  }

  @ApiOperation({ summary: 'Change email' })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Email changed successfully',
    schema: {
      example: {
        message: 'Email changed successfully',
      }
    }
  })
  @Put('change-email')
  @UseGuards(AuthGuard)
  async putChangeEmail(@Req() request: AuthenticatedRequest, @Body() putChangeEmailDto: dto.PutChangeEmailDto) {
    this.logger.log(`There is a change email request`);
    return this.authService.changeEmail(request.user.id, putChangeEmailDto);
  }

  @ApiOperation({ summary: 'Change password' })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Password changed successfully',
    schema: {
      example: {
        message: 'Password changed successfully',
      }
    }
  })
  @Put('change-password')
  @UseGuards(AuthGuard)
  async putChangePassword(@Req() request: AuthenticatedRequest, @Body() putChangePasswordDto: dto.PutChangePasswordDto) {
    this.logger.log(`There is a change password request`);
    return this.authService.changePassword(request.user.id, putChangePasswordDto);
  }
}
