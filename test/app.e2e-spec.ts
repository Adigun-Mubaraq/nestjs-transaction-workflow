import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CreateTransactionDto } from '../src/transactions/dto/create-transaction.dto';
import { TransactionsController } from '../src/transactions/transactions.controller';
import { TransactionsService } from '../src/transactions/transactions.service';

describe('TransactionsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: {
            initiate: jest.fn(async (_key: string, input: CreateTransactionDto) => ({
              id: 'tx-1',
              amountMinor: input.amountMinor,
              currency: input.currency.toUpperCase(),
              status: 'PENDING',
              providerReference: null,
              failureCode: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
            getById: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => app.close());

  it('requires an idempotency key', () =>
    request(app.getHttpServer())
      .post('/api/transactions')
      .send({ amountMinor: 250000, currency: 'USD' })
      .expect(400));

  it('creates a transaction with a valid request', () =>
    request(app.getHttpServer())
      .post('/api/transactions')
      .set('Idempotency-Key', 'order-123')
      .send({ amountMinor: 250000, currency: 'usd' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('PENDING');
        expect(body.currency).toBe('USD');
      }));
});
