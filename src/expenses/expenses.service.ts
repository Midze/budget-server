import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GraphQLError } from 'graphql';
import { Model, Types } from 'mongoose';
import { CategoriesService } from 'src/categories/categories.service';
import { UpdateExpensesInput, CreateExpensesInput, RemoveExpensesCategoryInput } from './expenses-input.dto';
import { Expense, Expenses, ExpensesByPeriod, ExpensesDocument } from './expenses.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expenses.name) private ExpensesModel: Model<ExpensesDocument>,
    private readonly categoriesService: CategoriesService
  ) {}

  getDayTota(expenses:Expense[]): string {
    const total = expenses.reduce(function(total = 0, expense) {
      return total + Number(expense.price);
    }, 0);
    return total.toString();
  }

  async getMonthExpenses(userId: string, day: number, week: number, year: number, month: number) {
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
      let currentDayExpensesId: string | null;
      const categories = await this.categoriesService.find(userId);
      const expenses = await this.ExpensesModel.find({
        userId,
        year,
        month,
      }).exec();

      expenses.forEach((expense) => {
        const expenses = expense.expenses;
        // this.addExpensesTotat(expense._id);
        // to-do create function for data splitting
        if (expense.day === day) {
          currentDayExpensesId = expense._id;
          dayExpenses.expenses = expenses;
          dayExpenses.total = expenses.reduce(function(total = 0, expense) {
            return total + Number(expense.price);
          }, 0);
        }

        if (expense.week === week) {
          weekExpenses.expenses.push(...expenses);
          weekExpenses.total += expenses.reduce(function(total = 0, expense) {
            return total + Number(expense.price);
          }, 0);
        }
        if (expense.month === month) {
          monthExpenses.expenses.push(...expenses);
          monthExpenses.total += expenses.reduce(function(total = 0, expense) {
            return total + Number(expense.price);
          }, 0);
        }

      });

      return {
        day: {
          ...dayExpenses,
          _id: currentDayExpensesId,
        },
        week: weekExpenses,
        month: monthExpenses,
        categories,
      };
    } catch (err) {
      console.error(err);
    }
  }

  async getByMonthExpenses(userId: string, months: number[], year: number) {
    const categories = await this.categoriesService.find(userId);
    const expenses = await this.ExpensesModel.find({
      userId,
      month: { $in: months },
      year,
    }).exec();
    const expensesByMonth: {
      [key: string]: {
        total: number,
        expenses: Expense[]
      }
    } = {};
    expenses.forEach((expense) => {
      const expenses = expense.expenses;
      const month = expense.month;
      const total = expense.total;
      if (expensesByMonth[month]) {
        expensesByMonth[month].total += +expense.total;
        expensesByMonth[month].expenses.push(...expenses);
      } else {
        expensesByMonth[month] = {
          total: total ? +total : 0,
          expenses: expenses
        };
      }
      
    });
    return {
      categories,
      expensesByMonth: Object.values(expensesByMonth)
    };
  }

  async updateExpenses(
    _id: Types.ObjectId,
    updateExpenseInput: UpdateExpensesInput,
  ) {
    try {
      const { expenses } = updateExpenseInput;
      const total = this.getDayTota(expenses);
      const {userId, day, week, year, month} = await this.ExpensesModel.findByIdAndUpdate(
        _id,
        {
          ...updateExpenseInput,
          total
        }
      );
      return await this.getMonthExpenses(userId, day, week, year, month);
    } catch (err) {
      console.error(err);
    }
  }

  async moveExpensesToUncategorized(removeExpensesCategoryInput: RemoveExpensesCategoryInput) {
    try {
      const { ids, userId, day, month, week, year } = removeExpensesCategoryInput;
      const categories = await this.categoriesService.removeCategory(ids, userId);
      const { ok, n, nModified } = await this.ExpensesModel.updateMany({
        "userId": userId 
      },
      {
        $set: {
          "expenses.$[elem].category": "61eafc104b88e154caa58616"
        }
      },
      {
        arrayFilters: [
          {
            "elem.category": {
              $in: ids
            }
          }
        ]
      });
      const res = await this.getMonthExpenses(userId, day, week, year, month);
      if (ok && categories ) {
        return res;
      } else {
        new GraphQLError(`Error occurred while deleting category`);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async createExpenses(createExpensesInput: CreateExpensesInput) {
    try {
      const { expenses } = createExpensesInput;
      const total = this.getDayTota(expenses);
      const {userId, day, week, year, month} = await new this.ExpensesModel({
        ...createExpensesInput,
        total
      }).save();
      return await this.getMonthExpenses(userId, day, week, year, month);
    }
    catch (err) {
      console.error(err);
    }
  }

  async addExpensesTotat(_id: Types.ObjectId) {
    try {
      const {userId, day, week, year, month, expenses} = await this.ExpensesModel.findOne({_id});
      let total = 0;
      expenses.forEach(({price}) => {
        total += Number(price);
      })
      const {ok, n, nModified} = await this.ExpensesModel.updateOne(
        {_id},
        {$set: {total: String(total)}}
      )
      return await this.ExpensesModel.findOne({
        userId,
        day,
        week,
        month,
        year
      });
    }
    catch (err) {
      console.error(err);
    }
  }

  // async getDayExpense(
  //   userId: string,
  //   year: number,
  //   month: number,
  //   day: number,
  // ) {
  //   try {
  //     return await this.ExpensesModel.findOne({
  //       userId,
  //       year,
  //       month,
  //       day,
  //     });
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }

  // async getMonthExpense(userId: string, year: number, month: number) {
  //   try {
  //     return await this.ExpensesModel.find({
  //       userId,
  //       year,
  //       month,
  //     }).exec();
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }
}
