import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateCompensationDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  jobLevel: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  baseSalary: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  annualBonus: number;

  @IsString()
  @IsNotEmpty()
  equity: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  yearsOfExperience: number;
}
