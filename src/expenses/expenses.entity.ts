import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Field, ObjectType } from '@nestjs/graphql';
import { Document, Types } from 'mongoose';

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

export type ExpensesDocument = Expenses & Document;
export const ExpensesSchema = SchemaFactory.createForClass(Expenses);