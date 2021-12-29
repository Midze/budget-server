import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CategoriesService } from 'src/categories/categories.service';
import { UpdateExpensesInput, CreateExpensesInput } from './expenses-input.dto';
import { Expenses, ExpensesDocument } from './expenses.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expenses.name) private ExpensesModel: Model<ExpensesDocument>,
    private readonly categoriesService: CategoriesService
  ) {}
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
