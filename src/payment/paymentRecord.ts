import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = PaymentRecord & Document;

@Schema({ timestamps: true })
export class PaymentRecord {
  @Prop()
  userId: string;

  @Prop()
  paymentType: string;

  @Prop()
  seasonId: string;

  @Prop()
  paymentIntent: string;

  @Prop()
  totalAmount: number;

  @Prop()
  paymentStatus: string;
}

export const PaymentSchema = SchemaFactory.createForClass(PaymentRecord);
