import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionStatus } from './domain/transaction-status.enum';
import { TransactionEntity } from './infrastructure/transaction.entity';
import { TransactionsRepository } from './infrastructure/transactions.repository';
import { TransactionsService } from './transactions.service';

const now = new Date('2026-08-03T00:00:00Z');

function makeTransaction(overrides: Partial<TransactionEntity> = {}): TransactionEntity {
  return Object.assign(new TransactionEntity(), {
    id: 'tx-1',
    idempotencyKey: 'idem-1',
    amountMinor: '250000',
    currency: 'USD',
    status: TransactionStatus.PENDING,
    providerReference: null,
    failureCode: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repository: jest.Mocked<TransactionsRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionsRepository,
          useValue: {
            findById: jest.fn(),
            findByIdempotencyKey: jest.fn(),
            findByProviderReference: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(TransactionsService);
    repository = moduleRef.get(TransactionsRepository);
  });

  it('returns an existing transaction for a repeated idempotency key', async () => {
    repository.findByIdempotencyKey.mockResolvedValue(makeTransaction());

    const result = await service.initiate('idem-1', { amountMinor: 250000, currency: 'usd' });

    expect(result.id).toBe('tx-1');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('creates a pending transaction on first initiation', async () => {
    repository.findByIdempotencyKey.mockResolvedValue(null);
    repository.create.mockImplementation((input) => makeTransaction(input));
    repository.save.mockImplementation(async (input) => input);

    const input: CreateTransactionDto = { amountMinor: 250000, currency: 'usd' };
    const result = await service.initiate('idem-1', input);

    expect(result.status).toBe(TransactionStatus.PENDING);
    expect(result.currency).toBe('USD');
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('applies a provider result idempotently', async () => {
    repository.findByProviderReference.mockResolvedValue(
      makeTransaction({ status: TransactionStatus.PROCESSING, providerReference: 'provider-1' }),
    );
    repository.save.mockImplementation(async (input) => input);

    const result = await service.applyProviderResult({
      providerReference: 'provider-1',
      status: TransactionStatus.SUCCEEDED,
    });

    expect(result.status).toBe(TransactionStatus.SUCCEEDED);
  });

  it('throws when a provider reference is unknown', async () => {
    repository.findByProviderReference.mockResolvedValue(null);

    await expect(
      service.applyProviderResult({
        providerReference: 'missing',
        status: TransactionStatus.SUCCEEDED,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
