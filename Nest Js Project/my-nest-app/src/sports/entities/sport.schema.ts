import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SportDocument = Sport & Document;

@Schema({ timestamps: true, collection: 'sports' })
export class Sport {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  description: string;
}
export const SportSchema = SchemaFactory.createForClass(Sport);
