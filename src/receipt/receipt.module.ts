import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReceiptResolver } from './receipt.resolver';
import { ReceiptService } from './receipt.service';
import { CategoriesModule } from '../categories/categories.module';
import { GlossaryModule } from '../glossary/glossary.module';
import { ReceiptRecord, ReceiptRecordSchema } from './receipt-record.entity';
import { ExpensesModule } from '../expenses/expenses.module';
import { ReceiptController } from './receipt.controller';

@Module({
  imports: [
    CategoriesModule,
    GlossaryModule,
    ExpensesModule,
    MongooseModule.forFeature([{ name: ReceiptRecord.name, schema: ReceiptRecordSchema }]),
  ],
  providers: [ReceiptResolver, ReceiptService],
  controllers: [ReceiptController],
})
export class ReceiptModule {}
