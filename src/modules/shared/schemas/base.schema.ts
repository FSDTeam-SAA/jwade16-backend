import { Prop } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

export abstract class BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: false })
  isDeleted: boolean;
}
