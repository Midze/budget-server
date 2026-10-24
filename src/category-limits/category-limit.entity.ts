import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class CategoryLimitRecord {
  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) categoryId: string;
  @Prop({ required: true }) period: string;
  @Prop({ required: true, enum: ['default', 'month'] }) scope: string;
  @Prop({ type: Number, default: null, min: 0 }) monthlyLimit: number | null;
}

export type CategoryLimitDocument = CategoryLimitRecord & Document;
export const CategoryLimitSchema = SchemaFactory.createForClass(CategoryLimitRecord);
CategoryLimitSchema.index({ userId: 1, categoryId: 1, scope: 1, period: 1 }, { unique: true });

@ObjectType()
export class CategoryLimit {
  @Field() categoryId: string;
  @Field() name: string;
  @Field(() => String, { nullable: true }) childOf: string | null;
  @Field(() => Float, { nullable: true }) monthlyLimit: number | null;
  @Field(() => Float, { nullable: true }) defaultLimit: number | null;
  @Field() isOverride: boolean;
}

@InputType()
export class CategoryLimitChange {
  @Field() categoryId: string;
  @Field(() => Float, { nullable: true }) monthlyLimit?: number | null;
  @Field({ nullable: true }) resetToDefault?: boolean;
}
