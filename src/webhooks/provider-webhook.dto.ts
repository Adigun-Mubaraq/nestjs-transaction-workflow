import { IsIn, IsOptional, IsString } from 'class-validator';

export class ProviderWebhookDto {
  @IsString()
  providerReference!: string;

  @IsIn(['SUCCEEDED', 'FAILED'])
  status!: 'SUCCEEDED' | 'FAILED';

  @IsOptional()
  @IsString()
  failureCode?: string;
}
