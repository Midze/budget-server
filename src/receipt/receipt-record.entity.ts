import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Field, ObjectType } from '@nestjs/graphql';
import { Document, Types } from 'mongoose';

@ObjectType()
@Schema({ _id: false })
export class ReceiptStoredItem {
  @Field(() => String)
  @Prop({ default: '' })
  name: string;

  @Field(() => String)
  @Prop({ default: '0.00' })
  price: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  categoryId?: string | null;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  categoryName?: string | null;
}

export const ReceiptStoredItemSchema =
  SchemaFactory.createForClass(ReceiptStoredItem);

@ObjectType()
@Schema({ timestamps: true })
export class ReceiptRecord {
  @Field(() => String)
  _id: Types.ObjectId;

  @Field(() => String)
  @Prop({ required: true, index: true })
  userId: string;

  @Field(() => String)
  @Prop()
  originalFileName: string;

  @Field(() => String, { nullable: true })
  @Prop({ index: true, default: null })
  fileHash?: string | null;

  @Field(() => String)
  @Prop({ required: true })
  storedFileName: string;

  @Field(() => String)
  @Prop({ required: true })
  fileType: string;

  @Prop({ required: true })
  storagePath: string;

  @Field(() => Number)
  @Prop({ required: true })
  fileSizeBytes: number;

  @Field(() => String)
  @Prop({ required: true, default: 'uploaded' })
  status: string;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  merchantName?: string | null;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  detectedMerchantName?: string | null;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  receiptDate?: string | null;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  detectedReceiptDate?: string | null;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  selectedDateAtUpload?: string | null;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  effectiveExpenseDate?: string | null;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  total?: string | null;

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  detectedTotal?: string | null;

  @Field(() => [ReceiptStoredItem])
  @Prop({ type: [ReceiptStoredItemSchema], default: [] })
  items: ReceiptStoredItem[];

  @Field(() => String, { nullable: true })
  @Prop({ default: null })
  errorMessage?: string | null;

  @Field(() => String, { nullable: true })
  createdAt?: Date;

  @Field(() => String, { nullable: true })
  updatedAt?: Date;
}

export type ReceiptRecordDocument = ReceiptRecord & Document;
export const ReceiptRecordSchema = SchemaFactory.createForClass(ReceiptRecord);
ReceiptRecordSchema.index({ userId: 1, fileHash: 1 });
