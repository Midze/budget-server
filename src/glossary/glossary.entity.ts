import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Field, ObjectType } from '@nestjs/graphql';
import { Document, Types } from 'mongoose';

@ObjectType()
@Schema()
export class GlossaryEntry {
  @Field(() => String)
  _id: Types.ObjectId;

  @Field(() => String)
  @Prop({ index: true })
  phrase: string;

  @Field(() => String)
  @Prop()
  categoryId: string;
}

export type GlossaryEntryDocument = GlossaryEntry & Document;
export const GlossaryEntrySchema = SchemaFactory.createForClass(GlossaryEntry);
GlossaryEntrySchema.index({ phrase: 1, categoryId: 1 }, { unique: true });
