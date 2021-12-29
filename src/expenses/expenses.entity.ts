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

    @Field(() => Number)
    @Prop()
    price: number;
}

@ObjectType()
@Schema()
export class Expenses {
    @Field(() => String)
    _id: Types.ObjectId;

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
}

@ObjectType()
@Schema()
export class ExpensesWithCategories {
    @Field(() => [Expenses])
    @Prop({nullable: true})
    expenses?: Expenses[];

    @Field(() => [Categories])
    @Prop({nullable: true})
    categories?: Categories[];
}

export type ExpensesDocument = Expenses & Document;
// export type ExpensesWithCategoriesDocument = ExpensesWithCategories & Document;
export const ExpensesSchema = SchemaFactory.createForClass(Expenses);