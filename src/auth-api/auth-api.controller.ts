import * as path from 'path';
import { Controller, Logger, UseGuards, Req, Body, Post, Get, Put, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { AuthApiService } from './auth-api.service';
import { PostEmailOtpDto, PostLoginDto, PutUpdateProfileDto, PutChangePasswordDto, PostForgotPasswordDto } from './dto';
import { AuthGuard } from '../guard/auth.guard';
import AuthenticatedRequest from '../guard/AuthenticatedRequest';

@ApiTags('Auth')
@Controller('auth')
export class AuthApiController {
  private readonly logger = new Logger(AuthApiController.name);
  constructor(private readonly authService: AuthApiService) {}

  @ApiOperation({ summary: 'Email OTP' })
  @ApiOkResponse({ 
    description: 'Email OTP sent successfully', 
    schema: {
      example: {
        message: 'Email OTP sent successfully',
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Email is incorrect', 
    schema: { 
      example: { 
        message: [
          'email must be an email'
        ],
        error: 'Bad Request',
        statusCode: 400
      }      
    } 
  })
  @Post('email-otp')
  postEmailOtp(@Body() postEmailOtpDto: PostEmailOtpDto) {
    this.logger.log(`There is a email otp request`);
    return this.authService.postEmailOtp(postEmailOtpDto);
  }

  @ApiOperation({ summary: 'Login' })
  @ApiOkResponse({ 
    description: 'User logged in successfully', 
    schema: { 
      example: { 
        message: 'User logged in successfully', 
        data: { 
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c', 
          user: { 
            id: 'c353a34c-2aad-44c4-8830-796360c16d2e', 
            username: 'Bill Valentinov', 
            role: 'Admin System' 
          } 
        } 
      } 
    }  
  })
  @ApiUnauthorizedResponse({ 
    description: 'Email or password is incorrect', 
    schema: { 
      example: { 
        message: 'Email or password is incorrect',
        error: 'Unauthorized',
        statusCode: 401
      }      
    } 
  })
  @Post('login')
  postLogin(@Body() postLoginDto: PostLoginDto) {
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
  @ApiUnauthorizedResponse({
    description: 'Email or phone number not found or does not match',
    schema: {
      example: {
        message: "Email or phone number not found or does not match",
        error: "Not Found",
        statusCode: 404
      }
    }
  })
  @Post('forgot-password')
  postForgotPassword(@Body() PostForgotPasswordDto: PostForgotPasswordDto) {
    this.logger.log(`There is a forgot password request`);
    return this.authService.postForgotPassword(PostForgotPasswordDto);
  }

  @ApiOperation({ summary: 'Get profile' })
  @ApiBearerAuth()
  @ApiHeader({ name: 'Authorization', description: 'Bearer token', required: true })
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
  @ApiUnauthorizedResponse({
    description: 'Token invalid',
    schema: {
      example: {
        message : 'Invalid token',
        error : 'Unauthorized',
        statusCode: 401
      }
    }
  })
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.authService.getProfile(request.user.id);
  }

  @ApiOperation({ summary: 'Update profile' })
  @ApiBearerAuth()
  @ApiHeader({ name: 'Authorization', description: 'Bearer token', required: true })
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
  @ApiUnauthorizedResponse({
    description: 'Phone number validation failed',
    schema: {
      example: {
        message: [ "Phone number cannot be empty" ],
        error: "Bad Request",
        statusCode: 400
      }
    }
  })
  @Put('update-profile')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('profile_picture',
    {
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Profile picture must be an image. Only jpg, jpeg, and png are allowed!'), false);
        }
        if (file.size > 1024 * 1024 * 2) {
          return cb(new BadRequestException('Profile picture size cannot be more than 2MB'), false);
        }
        cb(null, true);
      },
      storage: diskStorage({
        destination: process.env.NODE_ENV === 'production'
        ? '/var/www/uploads/profile_pictures'
        : './uploads/profile_pictures',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
        },
      }),
    }
  ))
  putUpdateProfile(@Req() request: AuthenticatedRequest, @Body() putUpdateProfileDto: PutUpdateProfileDto) {
    this.logger.log(`There is an update profile request`);
    return this.authService.updateUserProfile(request, request.user.id, putUpdateProfileDto, request.file?.filename ?? null);
  }

  @Put('change-password')
  @UseGuards(AuthGuard)
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
  @ApiUnauthorizedResponse({
    description: 'Incorrect old password',
    schema: {
      example: {
        message: "Incorrect old password",
        error: "Bad Request",
        statusCode: 400
      }
    }
  })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token', required: true })
  putChangePassword(@Req() request: AuthenticatedRequest, @Body() putChangePasswordDto: PutChangePasswordDto) {
    this.logger.log(`There is a change password request`);
    return this.authService.changePassword(request.user.id, putChangePasswordDto);
  }
}
