// src/user/user.input.ts
import { Field, ID, InputType } from '@nestjs/graphql';


@InputType()
export class ExpenseInput {
  @Field()
  category: number;

  @Field()
  price: number;
}

@InputType()
export class CreateExpensesInput {
  @Field(() => ID)
  _id: string;

  @Field()
  date: Date;

  @Field(() => [ExpenseInput])
  expenses: ExpenseInput[];
}

@InputType()
export class UpdateExpensesInput {
  @Field(() => ID)
  _id: string;

  @Field()
  date?: Date;

  @Field(() => [ExpenseInput])
  expenses: ExpenseInput[];
}