import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionStatus } from '../transactions/domain/transaction-status.enum';
import { TransactionResponseDto } from '../transactions/dto/transaction-response.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { ProviderWebhookDto } from './provider-webhook.dto';
import { WebhookSignatureService } from './webhook-signature.service';

@ApiTags('webhooks')
@Controller('webhooks/provider')
export class WebhooksController {
  constructor(
    private readonly signatures: WebhookSignatureService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Apply a signed provider result idempotently' })
  @ApiHeader({ name: 'X-Webhook-Signature', required: true })
  handle(
    @Headers('x-webhook-signature') signature: string | undefined,
    @Body() input: ProviderWebhookDto,
  ): Promise<TransactionResponseDto> {
    this.signatures.verify(input, signature);
    return this.transactionsService.applyProviderResult({
      providerReference: input.providerReference,
      status: input.status === 'SUCCEEDED' ? TransactionStatus.SUCCEEDED : TransactionStatus.FAILED,
      failureCode: input.failureCode,
    });
  }
}
