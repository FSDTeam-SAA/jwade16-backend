import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StoryInfoDocument = StoryInfo & Document;

@Schema()
export class StoryInfo {
  @Prop()
  title: string;

  // Add other properties as needed
}

export const StoryInfoSchema = SchemaFactory.createForClass(StoryInfo);
