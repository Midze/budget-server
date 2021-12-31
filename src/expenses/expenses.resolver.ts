import { Args, Query, Mutation, Resolver, ID } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { CreateExpensesInput, UpdateExpensesInput } from './expenses-input.dto';
import { Expenses, ExpensesWithCategories } from './expenses.entity';
import { ExpensesService } from './expenses.service';

@Resolver()
export class ExpensesResolver {
    constructor(private readonly expensesService: ExpensesService) {}

    @Query(() => Expenses)
    async getDayExpense(
        @Args('year', { type: () => Number }) year: number,
        @Args('month', { type: () => Number }) month: number,
        @Args('day', { type: () => Number }) day: number,
        @Args('userId', { type: () => String }) userId: string,
        ) {
      try {
        return await this.expensesService.getDayExpense(
            userId,
            year,
            month,
            day,
            );
      } catch (err) {
        console.error(err);
      }
    }

    @Query(() => [Expenses])
    async monthExpenses(
        @Args('year', { type: () => Number }) year: number,
        @Args('month', { type: () => Number }) month: number,
        @Args('userId', { type: () => String }) userId: string,
        ) {
      try {
        return await this.expensesService.getMonthExpense(
            userId,
            year,
            month,
            );
      } catch (err) {
        console.error(err);
      }
    }

    @Query(() => ExpensesWithCategories)
    async getMothExpenses(
        @Args('day', { type: () => Number }) day: number,
        @Args('week', { type: () => Number }) week: number,
        @Args('year', { type: () => Number }) year: number,
        @Args('month', { type: () => Number }) month: number,
        @Args('userId', { type: () => String }) userId: string,
        ) {
      try {
        return await this.expensesService.getMothExpenses(
            userId,
            day,
            week,
            year,
            month,
            );
      } catch (err) {
        console.error(err);
      }
    }
    
    @Mutation(() => Expenses)
    async createExpenses(@Args('createExpensesInput') createExpensesInput: CreateExpensesInput) {
      try {
        return await this.expensesService.createExpenses(createExpensesInput);
      } catch (err) {
        console.error(err);
      }
    }

    @Mutation(() => Expenses)
    async updateExpenses(
      @Args('_id',{ type: () => String }) _id: Types.ObjectId,
      @Args('updateExpenseInput') updateExpenseInput: UpdateExpensesInput,
    ) {
      try {
        return await this.expensesService.updateExpenses(_id, updateExpenseInput);
      } catch (err) {
        console.error(err);
      }
    }
}
