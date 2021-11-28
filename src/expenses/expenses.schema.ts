import { Field, ID, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { Document, Schema } from 'mongoose';


export const ExpenseSchema = new mongoose.Schema({
  category: Number,
  price: String,
});

export const ExpensesSchema = new mongoose.Schema({
  _id: Schema.Types.ObjectId,
  date: Date,
  expenses: [ExpenseSchema]
});

@ObjectType()
export class Expense {
  @Field()
  category: number;

  @Field()
  price: number;
}

@ObjectType()
export class Expenses extends Document {
  @Field(() => ID)
  _id: string;
  
  @Field()
  date?: Date;
 
  @Field(() => [Expense])
  expenses: Expense[];
}
