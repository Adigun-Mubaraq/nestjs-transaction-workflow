import 'dotenv/config';
import { DataSource } from 'typeorm';
import { TransactionEntity } from './transactions/infrastructure/transaction.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'payments',
  entities: [TransactionEntity],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
