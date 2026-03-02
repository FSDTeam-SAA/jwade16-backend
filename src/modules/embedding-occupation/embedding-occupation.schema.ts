import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmbeddingOccupationDocument = embeddingOccupation & Document;

@Schema()
export class embeddingOccupation {
  @Prop({ required: true })
  title?: string;

  @Prop({ type: [Number] })
  embedding?: number[];
}

export const embeddingOccupationSchema =
  SchemaFactory.createForClass(embeddingOccupation);
