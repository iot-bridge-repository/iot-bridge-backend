import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class PostDto {
  @ApiProperty({ example: 'KOLAM A - RAS', description: 'Device name' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @IsString({ message: 'Name must be a string' })
  @Length(5, 100, { message: 'Name must be between 5 and 100 characters' })
  name: string;
}

export class PatchDto {
  @ApiProperty({ example: 'KOLAM A - RAS', description: 'Device name' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @IsString({ message: 'Name must be a string' })
  @Length(5, 100, { message: 'Name must be between 5 and 100 characters' })
  name: string;
}
