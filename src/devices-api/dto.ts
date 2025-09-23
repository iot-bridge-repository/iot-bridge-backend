import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, IsOptional, IsEnum, IsBoolean } from 'class-validator';

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

export class PutWidgetBoxDto {
  @ApiProperty({ example: 'xxxxxx', description: 'widget box id' })
  @IsOptional()
  @IsString({ message: 'Id must be a string' })
  id: string;

  @ApiProperty({ example: 'suhu', description: 'widget box name' })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
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

enum ComparisonType {
  EQUAL = '=',
  GREATER = '>',
  LESSER = '<',
  GREATER_OR_EQUAL = '>=',
  LESSER_OR_EQUAL = '<=',
  NOT_EQUAL = '!='
}

export class PostNotificationEventDto {
  @ApiProperty({ example: 'V1', description: 'notification event pin' })
  @IsString({ message: 'Pin must be a string' })
  @Length(1, 20, { message: 'Pin must be between 1 and 20 characters' })
  pin: string;

  @ApiProperty({ example: 'suhu telalu dingin', description: 'notification event subject' })
  @IsString({ message: 'Subject must be a string' })
  @Length(5, 100, { message: 'Subject must be between 5 and 100 characters' })
  subject: string;

  @ApiProperty({ example: 'suhu telalu dingin, nyalakan pompa', description: 'notification event message' })
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @IsString({ message: 'Message must be a string' })
  @Length(5, 1000, { message: 'Message must be between 5 and 1000 characters' })
  message: string;

  @ApiProperty({ example: ComparisonType.EQUAL, description: 'comparison type', enum: ComparisonType })
  @IsNotEmpty({ message: 'Comparison type cannot be empty' })
  @IsEnum(ComparisonType, { message: 'Comparison type must be either =, >, <, >=, <=, != symbol', })
  comparison_type: ComparisonType;

  @ApiProperty({ example: '50', description: 'threshold value' })
  @IsString({ message: 'Threshold value must be a string' })
  @Length(1, 20, { message: 'Threshold value must be between 1 and 20 characters' })
  threshold_value: string;

  @ApiProperty({ example: 'true', description: 'notification event status' })
  @IsNotEmpty({ message: 'Is active cannot be empty' })
  @IsBoolean({ message: 'Is active must be a boolean' })
  is_active: boolean;
}

export class PatchNotificationEventDto {
  @ApiProperty({ example: 'V1', description: 'notification event pin' })
  @IsString({ message: 'Pin must be a string' })
  @Length(1, 20, { message: 'Pin must be between 1 and 20 characters' })
  pin: string;

  @ApiProperty({ example: 'suhu telalu dingin', description: 'notification event subject' })
  @IsString({ message: 'Subject must be a string' })
  @Length(5, 100, { message: 'Subject must be between 5 and 100 characters' })
  subject: string;

  @ApiProperty({ example: 'suhu telalu dingin, nyalakan pompa', description: 'notification event message' })
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @IsString({ message: 'Message must be a string' })
  @Length(5, 1000, { message: 'Message must be between 5 and 1000 characters' })
  message: string;

  @ApiProperty({ example: ComparisonType.EQUAL, description: 'comparison type', enum: ComparisonType })
  @IsNotEmpty({ message: 'Comparison type cannot be empty' })
  @IsEnum(ComparisonType, { message: 'Comparison type must be either EQUAL, GREATER, LESSER, GREATER_OR_EQUAL, LESSER_OR_EQUAL, NOT_EQUAL symbol', })
  comparison_type: ComparisonType;

  @ApiProperty({ example: '50', description: 'threshold value' })
  @IsString({ message: 'Threshold value must be a string' })
  @Length(1, 20, { message: 'Threshold value must be between 1 and 20 characters' })
  threshold_value: string;

  @ApiProperty({ example: 'true', description: 'notification event status' })
  @IsNotEmpty({ message: 'Is active cannot be empty' })
  @IsBoolean({ message: 'Is active must be a boolean' })
  is_active: boolean;
}