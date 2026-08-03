import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TransactionStatus } from '../domain/transaction-status.enum';

@Entity({ name: 'transactions' })
@Index(['idempotencyKey'], { unique: true })
@Index(['providerReference'], { unique: true, where: '"providerReference" IS NOT NULL' })
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 128 })
  idempotencyKey!: string;

  @Column({ length: 3 })
  currency!: string;

  @Column({ type: 'bigint' })
  amountMinor!: string;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @Column({ type: 'varchar', nullable: true })
  providerReference!: string | null;

  @Column({ type: 'varchar', nullable: true })
  failureCode!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
