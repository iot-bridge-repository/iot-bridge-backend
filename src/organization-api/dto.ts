import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

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
  organizationId: string;
}

export class PatchUnverifyDto {
  @ApiProperty({ example: 'xxxxxx', description: 'Organization id' })
  @IsNotEmpty({ message: 'Organization id cannot be empty' })
  @IsString({ message: 'Organization id must be a string' })
  organizationId: string;
}

