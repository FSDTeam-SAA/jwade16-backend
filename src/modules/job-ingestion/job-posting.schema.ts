import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { JobSource } from './job-ingestion.types';

export type JobPostingDocument = JobPosting & Document;

@Schema({ timestamps: true, collection: 'job_postings' })
export class JobPosting {
  @Prop({ required: true, enum: ['adzuna', 'usajobs', 'greenhouse'] })
  source!: JobSource;

  @Prop({ required: true })
  externalJobId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  companyName!: string;

  @Prop()
  location?: string;

  @Prop()
  description?: string;

  @Prop()
  applyUrl?: string;

  @Prop()
  postedAt?: Date;

  @Prop()
  salaryMin?: number;

  @Prop()
  salaryMax?: number;

  @Prop()
  salaryCurrency?: string;

  @Prop()
  remoteType?: string;

  @Prop()
  employmentType?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({ type: Object })
  raw?: Record<string, unknown>;

  @Prop()
  lastSeenAt?: Date;
}

export const JobPostingSchema = SchemaFactory.createForClass(JobPosting);

JobPostingSchema.index({ source: 1, externalJobId: 1 }, { unique: true });
JobPostingSchema.index({ source: 1, postedAt: -1 });
