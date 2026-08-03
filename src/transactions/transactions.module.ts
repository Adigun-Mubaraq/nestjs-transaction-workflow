import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './infrastructure/transaction.entity';
import { TransactionsRepository } from './infrastructure/transactions.repository';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity])],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsRepository],
  exports: [TransactionsService],
})
export class TransactionsModule {}
