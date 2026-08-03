import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { assertTransitionAllowed } from './domain/transaction-state-machine';
import { TransactionStatus } from './domain/transaction-status.enum';
import { TransactionEntity } from './infrastructure/transaction.entity';
import { TransactionsRepository } from './infrastructure/transactions.repository';

export interface ProviderWebhookResult {
  providerReference: string;
  status: TransactionStatus.SUCCEEDED | TransactionStatus.FAILED;
  failureCode?: string;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly transactionsRepository: TransactionsRepository) {}

  async initiate(
    idempotencyKey: string,
    input: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const existing = await this.transactionsRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) return this.toResponse(existing);

    const transaction = this.transactionsRepository.create({
      idempotencyKey,
      amountMinor: String(input.amountMinor),
      currency: input.currency.toUpperCase(),
      status: TransactionStatus.PENDING,
    });

    try {
      return this.toResponse(await this.transactionsRepository.save(transaction));
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        const raced = await this.transactionsRepository.findByIdempotencyKey(idempotencyKey);
        if (raced) return this.toResponse(raced);
      }
      throw error;
    }
  }

  async getById(id: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionsRepository.findById(id);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return this.toResponse(transaction);
  }

  async markProcessing(id: string, providerReference: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionsRepository.findById(id);
    if (!transaction) throw new NotFoundException('Transaction not found');

    assertTransitionAllowed(transaction.status, TransactionStatus.PROCESSING);
    transaction.status = TransactionStatus.PROCESSING;
    transaction.providerReference = providerReference;
    return this.toResponse(await this.transactionsRepository.save(transaction));
  }

  async applyProviderResult(input: ProviderWebhookResult): Promise<TransactionResponseDto> {
    const transaction = await this.transactionsRepository.findByProviderReference(
      input.providerReference,
    );
    if (!transaction) throw new NotFoundException('Transaction not found for provider reference');

    if (transaction.status === input.status) return this.toResponse(transaction);

    assertTransitionAllowed(transaction.status, input.status);
    transaction.status = input.status;
    transaction.failureCode =
      input.status === TransactionStatus.FAILED ? (input.failureCode ?? 'UNKNOWN') : null;
    return this.toResponse(await this.transactionsRepository.save(transaction));
  }

  private toResponse(transaction: TransactionEntity): TransactionResponseDto {
    return {
      id: transaction.id,
      amountMinor: Number(transaction.amountMinor),
      currency: transaction.currency,
      status: transaction.status,
      providerReference: transaction.providerReference,
      failureCode: transaction.failureCode,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code ===
        '23505'
    );
  }
}
