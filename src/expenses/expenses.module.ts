// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { ExpensesResolver } from './expenses.resolver';
import { ExpensesService } from './expenses.service';
import { DatabaseModule } from '../database/database.module';
import { expensesProviders } from './expenses.providers';

@Module({
  imports: [DatabaseModule],
  providers: [ExpensesResolver, ExpensesService, ...expensesProviders],
})
export class ExpensesModule {}
