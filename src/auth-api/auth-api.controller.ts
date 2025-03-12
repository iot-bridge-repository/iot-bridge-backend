import { Controller, Body, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthApiService } from './auth-api.service';
import { LoginDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthApiController {
  constructor(private readonly authService: AuthApiService) {}

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
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
