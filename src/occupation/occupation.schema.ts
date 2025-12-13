import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OccupationDocument = Occupation & Document;

@Schema({ timestamps: true })
export class Occupation {
  @Prop({ required: true })
  AREA: number;

  @Prop()
  AREA_TITLE: string;

  @Prop()
  AREA_TYPE: number;

  @Prop()
  PRIM_STATE: string;

  @Prop()
  NAICS: string;

  @Prop()
  NAICS_TITLE: string;

  @Prop()
  I_GROUP: string;

  @Prop()
  OWN_CODE: number;

  @Prop()
  OCC_CODE: string;

  @Prop()
  OCC_TITLE: string;

  @Prop()
  O_GROUP: string;

  @Prop()
  TOT_EMP: number;

  @Prop()
  EMP_PRSE: number;

  @Prop()
  JOBS_1000?: number;

  @Prop()
  LOC_QUOTIENT?: number;

  @Prop()
  PCT_TOTAL?: number;

  @Prop()
  PCT_RPT?: number;

  @Prop()
  H_MEAN?: number;

  @Prop()
  A_MEAN?: number;

  @Prop()
  MEAN_PRSE?: number;

  @Prop()
  H_PCT10?: number;

  @Prop()
  H_PCT25?: number;

  @Prop()
  H_MEDIAN?: number;

  @Prop()
  H_PCT75?: number;

  @Prop()
  H_PCT90?: number;

  @Prop()
  A_PCT10?: number;

  @Prop()
  A_PCT25?: number;

  @Prop()
  A_MEDIAN?: number;

  @Prop()
  A_PCT75?: number;

  @Prop()
  A_PCT90?: number;
}

export const OccupationSchema = SchemaFactory.createForClass(Occupation);
