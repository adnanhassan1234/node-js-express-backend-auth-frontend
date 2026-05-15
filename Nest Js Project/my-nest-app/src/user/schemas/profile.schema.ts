import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type ProfileDocument = Profile & Document;

@Schema()
export class Profile {
  @Prop()
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'AddressTwo' })
  address: Types.ObjectId;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
