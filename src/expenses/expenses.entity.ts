import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Field, ObjectType } from '@nestjs/graphql';
import { Document, Types } from 'mongoose';
import { Categories } from 'src/categories/categories.entity';

@ObjectType()
@Schema()
export class Expense {
    @Field(() => String)
    @Prop()
    category: string;

    @Field(() => String)
    @Prop()
    price: string;
}

@ObjectType()
@Schema()
export class Expenses {
    @Field(() => String)
    _id: Types.ObjectId;

    @Field(() => String)
    @Prop()
    userId: string;

    @Field(() => Number)
    @Prop()
    year: number;

    @Field(() => Number)
    @Prop()
    month: number;

    @Field(() => Number)
    @Prop()
    day: number;

    @Field(() => Number)
    @Prop()
    week: number;

    @Field(() => [Expense])
    @Prop({nullable: true})
    expenses?: Expense[];

    @Field(() => String)
    @Prop()
    total?: string;
}

@ObjectType()
@Schema()
export class ExpensesByPeriod {
    @Field(() => Number)
    @Prop()
    total: number;

    @Field(() => [Expense])
    @Prop()
    expenses?: Expense[];
}

@ObjectType()
@Schema()
export class ByDayExpenses {
    @Field(() => [Expenses])
    @Prop()
    byDayExpenses: Expenses[];
}

@ObjectType()
@Schema()
export class ExpensesForDay extends ExpensesByPeriod {
    @Field(() => String, {nullable: true})
    _id: Types.ObjectId
}

@ObjectType()
@Schema()
export class ExpensesForMonth {
    @Field()
    @Prop()
    day: ExpensesForDay;

    @Field()
    @Prop()
    week: ExpensesByPeriod;

    @Field()
    @Prop()
    month: ExpensesByPeriod;
}

// @ObjectType()
// @Schema()
// export class RemoveExpensesCategory {
//     @Field()
//     @Prop()
//     ok: boolean;

//     @Field()
//     @Prop()
//     n: number;

//     @Field()
//     @Prop()
//     nModified: number;
// }
@ObjectType()
@Schema()
export class MonthExpenses {
    @Field(() => Number)
    @Prop()
    total: number;

    @Field(() => Number)
    @Prop({nullable: true})
    month?: number;

    @Field(() => Number)
    @Prop({nullable: true})
    year?: number;

    @Field(() => [Expense])
    @Prop()
    expenses?: Expense[]
}
@ObjectType()
@Schema()
export class ExpensesByMonth {
    @Field(() => [MonthExpenses])
    @Prop()
    expensesByMonth: MonthExpenses[];

    @Field(() => [Categories])
    @Prop({nullable: true})
    categories?: Categories[];
}
@ObjectType()
@Schema()
export class ExpensesWithCategories extends ExpensesForMonth {
    @Field(() => [Categories])
    @Prop({nullable: true})
    categories?: Categories[];
}

export type ExpensesDocument = Expenses & Document;
// export type ExpensesWithCategoriesDocument = ExpensesWithCategories & Document;
export const ExpensesSchema = SchemaFactory.createForClass(Expenses);