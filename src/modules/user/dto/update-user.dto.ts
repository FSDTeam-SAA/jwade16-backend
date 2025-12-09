import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'John', description: 'First name', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', description: 'Last name', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: '1990-01-01', description: 'Date of birth', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiProperty({ example: 'Male', description: 'Gender', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ example: '123 Main St', description: 'Address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 1234567890, description: 'Phone number', required: false })
  @IsOptional()
  @IsNumber()
  phoneNum?: number;
}
