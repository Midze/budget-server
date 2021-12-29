import { Field, InputType } from '@nestjs/graphql';
import { Types } from 'mongoose';

@InputType()
export class CreateCategoryInput {
  @Field()
  name: string;

  @Field(() => String, {nullable: true})
  childOf?: string;
}

// @InputType()
// export class CreateCategoryInput {
//   @Field(() => [CreateCategory])
//   categories: CreateCategory[];

// }