import { Module } from '@nestjs/common';
import { TransactionsModule } from '../transactions/transactions.module';
import { WebhookSignatureService } from './webhook-signature.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [TransactionsModule],
  controllers: [WebhooksController],
  providers: [WebhookSignatureService],
})
export class WebhooksModule {}
