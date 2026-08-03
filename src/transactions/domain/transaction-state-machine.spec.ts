import { ConflictException } from '@nestjs/common';
import { assertTransitionAllowed } from './transaction-state-machine';
import { TransactionStatus } from './transaction-status.enum';

describe('assertTransitionAllowed', () => {
  it('allows the happy-path transition sequence', () => {
    expect(() => assertTransitionAllowed(TransactionStatus.PENDING, TransactionStatus.PROCESSING)).not.toThrow();
    expect(() => assertTransitionAllowed(TransactionStatus.PROCESSING, TransactionStatus.SUCCEEDED)).not.toThrow();
  });

  it('allows idempotent duplicate state delivery', () => {
    expect(() => assertTransitionAllowed(TransactionStatus.SUCCEEDED, TransactionStatus.SUCCEEDED)).not.toThrow();
  });

  it('blocks terminal-state reversal', () => {
    expect(() => assertTransitionAllowed(TransactionStatus.SUCCEEDED, TransactionStatus.FAILED)).toThrow(
      ConflictException,
    );
  });
});
