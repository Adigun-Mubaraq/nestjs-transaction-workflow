import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class StartProcessingDto {
  @ApiProperty({ example: 'provider-tx-123' })
  @IsString()
  @MinLength(3)
  providerReference!: string;
}
