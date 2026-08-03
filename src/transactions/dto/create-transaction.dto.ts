import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, Length } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 250000, description: 'Amount in minor units, e.g. cents.' })
  @IsInt()
  @IsPositive()
  amountMinor!: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @Length(3, 3)
  currency!: string;
}
