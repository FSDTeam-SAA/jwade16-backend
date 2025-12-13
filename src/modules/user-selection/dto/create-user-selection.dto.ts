import { IsString, IsNumber, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserSelectionDto {
  @IsString()
  @IsNotEmpty()
  currentRole: string;

  @IsString()
  @IsNotEmpty()
  experience: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsNumber()
  @IsNotEmpty()
  compensation: number;

  @IsString()
  @IsNotEmpty()
  lastRaise: string;

  @IsString()
  @IsNotEmpty()
  negotiateCurrentSalary: string;

  @IsString()
  @IsNotEmpty()
  discussTime: string;

  @IsString()
  @IsNotEmpty()
  howConfident: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
