import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  userId: string;

  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsString()
  seasonId?: string;
}
