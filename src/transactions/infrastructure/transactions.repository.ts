import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from './transaction.entity';

@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repository: Repository<TransactionEntity>,
  ) {}

  findById(id: string): Promise<TransactionEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByIdempotencyKey(idempotencyKey: string): Promise<TransactionEntity | null> {
    return this.repository.findOne({ where: { idempotencyKey } });
  }

  findByProviderReference(providerReference: string): Promise<TransactionEntity | null> {
    return this.repository.findOne({ where: { providerReference } });
  }

  create(
    input: Pick<TransactionEntity, 'idempotencyKey' | 'amountMinor' | 'currency' | 'status'>,
  ): TransactionEntity {
    return this.repository.create(input);
  }

  save(transaction: TransactionEntity): Promise<TransactionEntity> {
    return this.repository.save(transaction);
  }
}
