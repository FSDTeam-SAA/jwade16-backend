import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '../shared/schemas/base.schema';

export type UserSelectionDocument = UserSelection & Document;

@Schema({ timestamps: true })
export class UserSelection extends BaseSchema {
  @Prop({ required: true })
  currentRole: string;

  @Prop({ required: true })
  experience: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  compensation: string; // user-provided range label

  @Prop()
  compensationValue?: number; // parsed numeric midpoint for calculations

  @Prop({ required: true })
  lastRaise: string;

  @Prop({ required: true })
  negotiateCurrentSalary: string;

  @Prop({ required: true })
  discussTime: string;

  @Prop({ required: true })
  howConfident: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  payPowerScore?: string;

  @Prop()
  marketGap?: string;
}

export const UserSelectionSchema = SchemaFactory.createForClass(UserSelection);
