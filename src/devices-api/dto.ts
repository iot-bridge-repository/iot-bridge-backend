import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

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

export class PutWidgetBoxesDto {
  @ApiProperty({ example: 'xxxxxx', description: 'widget box id' })
  @IsOptional()
  @IsString({ message: 'Id must be a string' })
  id: string;

  @ApiProperty({ example: 'suhu', description: 'widget box name' })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Length(3, 100, { message: 'Name must be between 3 and 100 characters' })
  name: string;

  @ApiProperty({ example: 'V1', description: 'widget box pin' })
  @IsOptional()
  @IsString({ message: 'Pin must be a string' })
  @Length(1, 20, { message: 'Pin must be between 1 and 20 characters' })
  pin: string;

  @ApiProperty({ example: 'Celcius', description: 'widget box unit' })
  @IsOptional()
  @IsString({ message: 'Unit must be a string' })
  @Length(1, 20, { message: 'Unit must be between 1 and 20 characters' })
  unit: string;

  @ApiProperty({ example: '0', description: 'widget box min value' })
  @IsOptional()
  @IsString({ message: 'Min value must be a string' })
  @Length(1, 20, { message: 'Min value must be between 1 and 20 characters' })
  min_value: string;

  @ApiProperty({ example: '100', description: 'widget box max value' })
  @IsOptional()
  @IsString({ message: 'Max value must be a string' })
  @Length(1, 20, { message: 'Max value must be between 1 and 20 characters' })
  max_value: string;

  @ApiProperty({ example: '50', description: 'widget box default value' })
  @IsOptional()
  @IsString({ message: 'Default value must be a string' })
  @Length(1, 20, { message: 'Default value must be between 1 and 20 characters' })
  default_value: string;
}
