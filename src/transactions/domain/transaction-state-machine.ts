import { ConflictException } from '@nestjs/common';
import { TransactionStatus } from './transaction-status.enum';

const allowedTransitions: Record<TransactionStatus, readonly TransactionStatus[]> = {
  [TransactionStatus.PENDING]: [TransactionStatus.PROCESSING, TransactionStatus.FAILED],
  [TransactionStatus.PROCESSING]: [TransactionStatus.SUCCEEDED, TransactionStatus.FAILED],
  [TransactionStatus.SUCCEEDED]: [],
  [TransactionStatus.FAILED]: [],
};

export function assertTransitionAllowed(from: TransactionStatus, to: TransactionStatus): void {
  if (from === to) return;
  if (!allowedTransitions[from].includes(to)) {
    throw new ConflictException(`Invalid transaction transition: ${from} -> ${to}`);
  }
}
