import { Model, FilterQuery, CreateQuery, UpdateQuery } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { Expenses } from './expenses.schema';

@Injectable()
export class ExpensesService {
  constructor(
    @Inject('EXPENSES_MODEL')
    private expensesModel: Model<Expenses>,
  ) {}

  async create(input: CreateQuery<Expenses>): Promise<Expenses> {
    return this.expensesModel.create(input);
  }

  async update(input: UpdateQuery<Expenses>): Promise<Expenses> {
    return this.expensesModel.findByIdAndUpdate(input._id, input, {new: true});
  }

  async findOne(query: FilterQuery<Expenses>): Promise<Expenses> {
    return this.expensesModel.findOne(query).lean();
  }

  async find(): Promise<Expenses[]> {
    return this.expensesModel.find().lean();
  }
}
