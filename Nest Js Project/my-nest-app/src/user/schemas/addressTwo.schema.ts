import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AddressTwoDocument = AddressTwo & Document;

@Schema()
export class AddressTwo {
  @Prop()
  city: string;

  @Prop()
  country: string;
}
export const AddressTwoSchema = SchemaFactory.createForClass(AddressTwo);
