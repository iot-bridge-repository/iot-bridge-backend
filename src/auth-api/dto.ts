import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, Length } from 'class-validator';

export class PostLoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @IsEmail({}, { message: 'Email is not valid' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
  password: string;
}

export class PutUpdateProfileDto {
  @ApiProperty({ example: 'username', description: 'User username' })
  @IsNotEmpty({ message: 'Username cannot be empty' })
  username: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @IsEmail({}, { message: 'Email is not valid' })
  email: string;

  @ApiProperty({ example: '08xxxxxxxx', description: 'User phone number' })
  @IsNotEmpty({ message: 'Phone number cannot be empty' })
  phone_number: string;

  @ApiProperty({ description: 'Profile picture file', example: 'profile_picture.jpg', required: false })
  @IsOptional()
  profile_picture?: Express.Multer.File;
}