import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Document, Types } from 'mongoose';

enum Roles {
  Admin = 'Admin',
  Basic = 'Basic',
}

registerEnumType(Roles, {
  name: 'Roles',
  description: 'Roles for Admin creating projects and users',
});

@ObjectType()
@Schema()
export class User {
  @Field(() => String)
  _id: Types.ObjectId;

  @Field(() => String)
  @Prop()
  login: string;

  @Field(() => String)
  @Prop()
  password: string;

  @Field(() => String)
  @Prop()
  email: string;

  @Field(() => String)
  @Prop()
  createdAt: string;

  @Field(() => Roles, { defaultValue: Roles.Admin, nullable: true })
  @Prop()
  roles?: string;
}

@ObjectType()
@Schema()
export class LoginUser {
  @Field(() => User)
  @Prop()
  user: User

  @Field(() => String)
  @Prop()
  token: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
