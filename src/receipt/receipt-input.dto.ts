import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { ReceiptRecord, ReceiptStoredItem } from './receipt-record.entity';

@InputType()
export class ProcessReceiptInput {
  @Field()
  userId: string;

  @Field()
  fileBase64: string;

  @Field()
  fileType: string;

  @Field({ nullable: true })
  fileName?: string;

  @Field({ nullable: true })
  selectedDate?: string;
}

@ObjectType()
export class ReceiptItem {
  @Field()
  name: string;

  @Field()
  price: string;

  @Field({ nullable: true })
  categoryId?: string | null;

  @Field({ nullable: true })
  categoryName?: string | null;
}

@ObjectType()
export class ProcessReceiptResult {
  @Field({ nullable: true })
  receiptId?: string;

  @Field()
  isDuplicate: boolean;

  @Field({ nullable: true })
  merchantName?: string | null;

  @Field({ nullable: true })
  receiptDate?: string | null;

  @Field({ nullable: true })
  effectiveExpenseDate?: string | null;

  @Field({ nullable: true })
  total?: string | null;

  @Field(() => [ReceiptItem])
  items: ReceiptItem[];
}

@InputType()
export class ReceiptStoredItemInput {
  @Field()
  name: string;

  @Field()
  price: string;

  @Field({ nullable: true })
  categoryId?: string | null;

  @Field({ nullable: true })
  categoryName?: string | null;
}

@InputType()
export class UpdateReceiptInput {
  @Field()
  receiptId: string;

  @Field({ nullable: true })
  merchantName?: string;

  @Field({ nullable: true })
  receiptDate?: string;

  @Field({ nullable: true })
  effectiveExpenseDate?: string;

  @Field({ nullable: true })
  total?: string;

  @Field(() => [ReceiptStoredItemInput], { nullable: true })
  items?: ReceiptStoredItemInput[];
}

@InputType()
export class ReceiptActionInput {
  @Field()
  receiptId: string;
}

@ObjectType()
export class ReceiptActionResult {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => ReceiptRecord, { nullable: true })
  receipt?: ReceiptRecord;
}
