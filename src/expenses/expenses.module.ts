import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesModule } from 'src/categories/categories.module';
import { Expenses, ExpensesSchema } from './expenses.entity';
import { ExpensesResolver } from './expenses.resolver';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Expenses.name, schema: ExpensesSchema }]),
    CategoriesModule,
  ],
  providers: [ExpensesResolver, ExpensesService],
})
export class ExpensesModule {}
