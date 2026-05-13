import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GlossaryEntryInput {
  @Field()
  phrase: string;

  @Field()
  categoryId: string;
}
