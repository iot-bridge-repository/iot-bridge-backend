import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, IsPhoneNumber, Matches } from 'class-validator';

export class PostRegisterDto {
  @ApiProperty({ example: 'username', description: 'User username' })
  @IsNotEmpty({ message: 'Username cannot be empty' })
  @IsString({ message: 'Username must be a string' })
  @Length(3, 20, { message: 'Username must be between 3 and 20 characters' })
  @Matches(/^\S.*\S$/, { message: 'Username cannot have leading or trailing spaces' })
  username: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @IsEmail({}, { message: 'Email is not valid' })
  email: string;

  @ApiProperty({ example: '08xxxxxxxx', description: 'User phone number' })
  @IsNotEmpty({ message: 'Phone number cannot be empty' })
  @Length(10, 15, { message: 'Phone number must be between 10 and 15 characters' })
  @IsPhoneNumber('ID', { message: 'Phone number is not valid' })
  phone_number: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
  password: string;
}

export class PostLoginDto {
  @ApiProperty({ example: 'username or user@example.com or 08xxxxxxxx', description: 'Can be email, phone number or username' })
  @IsNotEmpty({ message: 'Identity cannot be empty' })
  @IsString({ message: 'Identity must be a string' })
  identity: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
  password: string;
}

export class PostForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @IsEmail({}, { message: 'Email is not valid' })
  email: string;
}

export class PostResetPasswordDto{
  @ApiProperty({ example: 'xxxxxx', description: 'Token reset password' })
  @IsNotEmpty({ message: 'Token cannot be empty' })
  @IsString({ message: 'Token must be a string' })
  token: string;

  @ApiProperty({ example: 'newPassword123!', description: 'New password' })
  @IsNotEmpty({ message: 'New password cannot be empty' })
  @IsString({ message: 'New password must be a string' })
  @Length(6, 20, { message: 'New password must be between 6 and 20 characters' })
  new_password: string;
}

export class PatchProfileDto {
  @ApiProperty({ example: 'username', description: 'User username' })
  @IsNotEmpty({ message: 'Username cannot be empty' })
  @IsString({ message: 'Username must be a string' })
  @Length(3, 20, { message: 'Username must be between 3 and 20 characters' })
  username: string;

  @ApiProperty({ example: '08xxxxxxxx', description: 'User phone number' })
  @IsNotEmpty({ message: 'Phone number cannot be empty' })
  @IsPhoneNumber('ID', { message: 'Phone number is not valid' })
  @Length(10, 15, { message: 'Phone number must be between 10 and 15 characters' })
  phone_number: string;
}

export class PatchEmailDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsNotEmpty({ message: 'newEmail cannot be empty' })
  @IsEmail({}, { message: 'newEmail is not valid' })
  new_email: string;
}

export class PatchPasswordDto {
  @ApiProperty({ example: 'oldPassword123', description: 'Current password' })
  @IsNotEmpty({ message: 'Old password cannot be empty' })
  @IsString({ message: 'Old password must be a string' })
  old_password: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'New password' })
  @IsNotEmpty({ message: 'New password cannot be empty' })
  @IsString({ message: 'New password must be a string' })
  @Length(6, 20, { message: 'New password must be between 6 and 20 characters' })
  new_password: string;
}
