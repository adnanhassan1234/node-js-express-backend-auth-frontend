import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Address } from './address.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'app_users' })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  //  Embedded Schema
  @Prop({ type: Address, required: true })
  address: Address;

  @Prop({ type: Types.ObjectId, ref: 'AddressTwo' })
  addressTwo: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
