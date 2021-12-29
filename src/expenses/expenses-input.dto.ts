import { Field, InputType, OmitType, PartialType } from '@nestjs/graphql';


@InputType()
export class ExpenseInput {
  @Field()
  category: string;

  @Field()
  price: number;
}

@InputType()
export class CreateExpensesInput {
  @Field()
  userId: string;

  @Field()
  year: number;

  @Field()
  month: number;

  @Field()
  day: number;

  @Field()
  week: number;

  @Field(() => [ExpenseInput])
  expenses: ExpenseInput[];
}

@InputType()
export class UpdateExpensesInput extends PartialType(
  OmitType(CreateExpensesInput, ['year', 'month', 'day', 'week'] as const),
) {}