import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlExpensesGuard } from '../expenses/expenses.guard';
import {
  ProcessReceiptInput,
  ProcessReceiptResult,
  ReceiptActionInput,
  ReceiptActionResult,
  UpdateReceiptInput,
} from './receipt-input.dto';
import { ReceiptService } from './receipt.service';
import { ReceiptRecord } from './receipt-record.entity';

@Resolver()
export class ReceiptResolver {
  constructor(private readonly receiptService: ReceiptService) {}

  @Query(() => [ReceiptRecord])
  @UseGuards(GqlExpensesGuard)
  async getReceipts(@Args('userId') userId: string) {
    return this.receiptService.listReceipts(userId);
  }

  @Query(() => ReceiptRecord)
  @UseGuards(GqlExpensesGuard)
  async getReceipt(@Args('receiptId') receiptId: string, @Args('userId') userId: string) {
    return this.receiptService.getReceiptForUser(receiptId, userId);
  }

  @Mutation(() => ProcessReceiptResult)
  @UseGuards(GqlExpensesGuard)
  async processReceipt(
    @Args('processReceiptInput') processReceiptInput: ProcessReceiptInput,
  ) {
    return this.receiptService.processReceipt(processReceiptInput);
  }

  @Mutation(() => ReceiptRecord)
  @UseGuards(GqlExpensesGuard)
  async updateReceipt(@Args('userId') userId: string, @Args('updateReceiptInput') input: UpdateReceiptInput) {
    return this.receiptService.updateReceipt(userId, input);
  }

  @Mutation(() => ReceiptActionResult)
  @UseGuards(GqlExpensesGuard)
  async confirmReceipt(@Args('userId') userId: string, @Args('receiptActionInput') input: ReceiptActionInput) {
    return this.receiptService.confirmReceipt(userId, input.receiptId);
  }

  @Mutation(() => ReceiptRecord)
  @UseGuards(GqlExpensesGuard)
  async reprocessReceipt(@Args('userId') userId: string, @Args('receiptActionInput') input: ReceiptActionInput) {
    return this.receiptService.processStoredReceipt(input.receiptId, userId);
  }

  @Mutation(() => ReceiptActionResult)
  @UseGuards(GqlExpensesGuard)
  async deleteReceipt(@Args('userId') userId: string, @Args('receiptActionInput') input: ReceiptActionInput) {
    return this.receiptService.deleteReceipt(userId, input.receiptId);
  }
}
