import { Body, Controller, Get, Headers, Param, Post, BadRequestException } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { StartProcessingDto } from './dto/start-processing.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create or return a transaction for an idempotency key' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  initiate(
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() input: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency-Key header is required');
    return this.transactionsService.initiate(idempotencyKey.trim(), input);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Attach a provider reference and move a pending transaction to processing' })
  markProcessing(
    @Param('id') id: string,
    @Body() input: StartProcessingDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.markProcessing(id, input.providerReference);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a transaction by ID' })
  getById(@Param('id') id: string): Promise<TransactionResponseDto> {
    return this.transactionsService.getById(id);
  }
}
