import { Controller, Logger, UseGuards, Req, Body, Post, Get, Put, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthApiService } from './auth-api.service';
import { PostEmailOtpDto, PostLoginDto, PutUpdateProfileDto, PutChangePasswordDto, PutChangeEmailDto, PostForgotPasswordDto } from './dto';
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

  @ApiOperation({ summary: 'Email OTP' })
  @ApiOkResponse({ 
    description: 'Email OTP sent successfully', 
    schema: {
      example: {
        message: 'Email OTP sent successfully',
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
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZmMmQ2ZTE2LTdiMTAtNDZhOC04ZWI2LWY0YzliMTg0YWM4OSIsImlhdCI6MTc0NDIyNDI2NX0.E2IqEjRvdHK26vN32vLauC1amGT0evpee_sBPGw25G0', 
          user: { 
            id: 'c353a34c-2aad-44c4-8830-796360c16d2e', 
          } 
        } 
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
  @Post('forgot-password')
  postForgotPassword(@Body() PostForgotPasswordDto: PostForgotPasswordDto) {
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
  getProfile(@Req() request: AuthenticatedRequest) {
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
  async putUpdateProfile(@Req() request: AuthenticatedRequest, @Body() putUpdateProfileDto: PutUpdateProfileDto) {
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
  putChangeEmail(@Req() request: AuthenticatedRequest, @Body() putChangeEmailDto: PutChangeEmailDto) {
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
  putChangePassword(@Req() request: AuthenticatedRequest, @Body() putChangePasswordDto: PutChangePasswordDto) {
    this.logger.log(`There is a change password request`);
    return this.authService.changePassword(request.user.id, putChangePasswordDto);
  }
}
