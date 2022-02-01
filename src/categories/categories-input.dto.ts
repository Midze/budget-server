import { Field, InputType } from '@nestjs/graphql';
import { Types } from 'mongoose';

@InputType()
export class CreateCategoryInput {
  @Field()
  userId: string;

  @Field()
  name: string;

  @Field(() => String, {nullable: true})
  childOf: string | null;
}

