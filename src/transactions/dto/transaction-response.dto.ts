import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '../domain/transaction-status.enum';

export class TransactionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  amountMinor!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: TransactionStatus })
  status!: TransactionStatus;

  @ApiProperty({ nullable: true })
  providerReference!: string | null;

  @ApiProperty({ nullable: true })
  failureCode!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
