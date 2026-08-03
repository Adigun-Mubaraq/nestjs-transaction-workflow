import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

@Injectable()
export class WebhookSignatureService {
  constructor(private readonly config: ConfigService) {}

  verify(payload: unknown, signature: string | undefined): void {
    if (!signature) throw new UnauthorizedException('Missing webhook signature');

    const secret = this.config.get<string>('WEBHOOK_SECRET', 'local-webhook-secret');
    const expected = createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }
}
