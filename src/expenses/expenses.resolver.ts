// src/user/user.resolver.ts
import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { CreateExpensesInput, UpdateExpensesInput } from './expenses.input';
import { ExpensesService } from './expenses.service';
import { Expenses } from './expenses.schema';

@Resolver(() => Expenses)
export class ExpensesResolver {
  constructor(private expensesService: ExpensesService) {}

  @Mutation(() => Expenses)
  async createExpenses(@Args('input') input: CreateExpensesInput) {
    return this.expensesService.create(input);
  }

  @Mutation(() => Expenses)
  async updateExpenses(@Args('input') input: UpdateExpensesInput) {
    return await this.expensesService.update(input);
  }

  @Query(() => [Expenses])
  async expenses() {
    return this.expensesService.find();
  }
}
