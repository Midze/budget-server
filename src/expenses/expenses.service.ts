import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CategoriesService } from 'src/categories/categories.service';
import { UpdateExpensesInput, CreateExpensesInput } from './expenses-input.dto';
import { Expenses, ExpensesByPeriod, ExpensesDocument } from './expenses.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expenses.name) private ExpensesModel: Model<ExpensesDocument>,
    private readonly categoriesService: CategoriesService
  ) {}

  
  async getExpenses(userId: string, day: number, week: number, year: number, month: number) {
    try {
      const dayExpenses: ExpensesByPeriod = {
        total: 0,
        expenses: []
      };
      const weekExpenses: ExpensesByPeriod = {
        total: 0,
        expenses: []
      };
      const monthExpenses: ExpensesByPeriod = {
        total: 0,
        expenses: []
      };
      const categories = await this.categoriesService.find(userId);
      const expenses = await this.ExpensesModel.find({
        userId,
        year,
        month,
      }).exec();

      expenses.forEach((expense) => {
        const expenses = expense.expenses;
        // to-do create function for data splitting
        if (expense.day === day) {
          dayExpenses.expenses = expenses;
          dayExpenses.total = expenses.reduce(function(total = 0, expense) {
            return total + expense.price;
          }, 0);
        }

        if (expense.week === week) {
          weekExpenses.expenses.push(...expenses);
          weekExpenses.total += expenses.reduce(function(total = 0, expense) {
            return total + expense.price;
          }, 0);
        }
        if (expense.month === month) {
          monthExpenses.expenses.push(...expenses);
          monthExpenses.total += expenses.reduce(function(total = 0, expense) {
            return total + expense.price;
          }, 0);
        }

      });

      return {
        day: dayExpenses,
        week: weekExpenses,
        month: monthExpenses,
        categories,
      };
    } catch (err) {
      console.error(err);
    }
  }

  async getDayExpense(
    userId: string,
    year: number,
    month: number,
    day: number,
  ) {
    try {
      return await this.ExpensesModel.findOne({
        userId,
        year,
        month,
        day,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async getMonthExpense(userId: string, year: number, month: number) {
    try {
      return await this.ExpensesModel.find({
        userId,
        year,
        month,
      }).exec();
    } catch (err) {
      console.error(err);
    }
  }

  async updateExpenses(
    _id: Types.ObjectId,
    updateExpenseInput: UpdateExpensesInput,
  ) {
    try {
      return await this.ExpensesModel.findByIdAndUpdate(
        _id,
        updateExpenseInput,
        {
          new: true,
        },
      ).exec();
    } catch (err) {
      console.error(err);
    }
  }

  async createExpenses(createExpensesInput: CreateExpensesInput) {
    try {
        return await new this.ExpensesModel(createExpensesInput).save();
      }
    catch (err) {
      console.error(err);
    }
  }
}
