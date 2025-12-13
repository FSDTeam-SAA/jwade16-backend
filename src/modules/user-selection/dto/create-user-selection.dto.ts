import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  compensation: string; // range label, e.g., "Under $50k", "$50k-$75k", "$300k+"

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
