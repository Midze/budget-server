import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Field, ObjectType } from '@nestjs/graphql';
import { Document, Types } from 'mongoose';

@ObjectType()
@Schema()
export class Categories {
    @Field(() => String)
    _id: Types.ObjectId;

    @Field(() => String)
    @Prop()
    userId: string;

    @Field(() => String, { nullable: true })
    @Prop()
    childOf: string;

    @Field(() => String)
    @Prop()
    name: string;
}

export type CategoriesDocument = Categories & Document;
export const CategoriesSchema = SchemaFactory.createForClass(Categories);