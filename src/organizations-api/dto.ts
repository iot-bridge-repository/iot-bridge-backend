import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, Length, Matches, IsEnum } from 'class-validator';

export class PostProposeDto {
  @ApiProperty({ example: 'POKDAKAN BINTANG ROSELA JAYA', description: 'Organization name' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @IsString({ message: 'Name must be a string' })
  @Length(5, 100, { message: 'Name must be between 5 and 100 characters' })
  name: string;
}

export class PatchVerifyDto {
  @ApiProperty({ example: 'xxxxxx', description: 'Organization id' })
  @IsNotEmpty({ message: 'Organization id cannot be empty' })
  @IsString({ message: 'Organization id must be a string' })
  organization_id: string;
}

export class PatchUnverifyDto {
  @ApiProperty({ example: 'xxxxxx', description: 'Organization id' })
  @IsNotEmpty({ message: 'Organization id cannot be empty' })
  @IsString({ message: 'Organization id must be a string' })
  organization_id: string;
}

export class PatchOrganizationProfileDto {
  @ApiProperty({ example: 'POKDAKAN BINTANG ROSELA JAYA', description: 'Organization name' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @ApiProperty({ example: 'This is a description of the organization', description: 'Organization description' })
  @IsNotEmpty({ message: 'Description cannot be empty' })
  @IsString({ message: 'Description must be a string' })
  description: string;
}

export class PostMemberInvitationDto {
  @ApiProperty({ example: 'xxxxxx', description: 'User id' })
  @IsNotEmpty({ message: 'User id cannot be empty' })
  @IsString({ message: 'User id must be a string' })
  user_id: string;
}

export class PatchInvitationResponseDto {
  @ApiProperty({ example: 'true', description: 'Invitation response' })
  @IsNotEmpty({ message: 'Invitation response cannot be empty' })
  @IsBoolean({ message: 'Invitation response must be a boolean' })
  is_accepted: boolean;
}

export class PostLokalMemberDto {
  @ApiProperty({ example: 'username', description: 'User username' })
  @IsNotEmpty({ message: 'Username cannot be empty' })
  @IsString({ message: 'Username must be a string' })
  @Length(3, 20, { message: 'Username must be between 3 and 20 characters' })
  @Matches(/^\S.*\S$/, { message: 'Username cannot have leading or trailing spaces' })
  username: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
  password: string;
}

enum OrganizationMemberRole {
  OPERATOR = 'Operator',
  VIEWER = 'Viewer',
}
export class PatchMemberRolesDto {
  @ApiProperty({ example: 'xxxxxx', description: 'User id' })
  @IsNotEmpty({ message: 'User id cannot be empty' })
  @IsString({ message: 'User id must be a string' })
  user_id: string;

  @ApiProperty({ example: OrganizationMemberRole.OPERATOR, description: 'New role for the member (Operator or Viewer)', enum: OrganizationMemberRole, })
  @IsNotEmpty({ message: 'New role cannot be empty' })
  @IsEnum(OrganizationMemberRole, { message: 'New role must be either Operator or Viewer',})
  new_role: OrganizationMemberRole;
}
