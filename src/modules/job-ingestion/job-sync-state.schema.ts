import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { JobSource } from './job-ingestion.types';

export type JobSyncStateDocument = JobSyncState & Document;

@Schema({ timestamps: true, collection: 'job_sync_states' })
export class JobSyncState {
  @Prop({
    required: true,
    unique: true,
    enum: ['adzuna', 'usajobs', 'greenhouse'],
  })
  source!: JobSource;

  @Prop()
  lastRunStartedAt?: Date;

  @Prop()
  lastRunCompletedAt?: Date;

  @Prop()
  lastSuccessfulSyncAt?: Date;

  @Prop({ default: 'idle' })
  status!: 'idle' | 'running' | 'failed' | 'succeeded';

  @Prop()
  lastError?: string;

  @Prop()
  lastPage?: number;

  @Prop({ type: Object })
  lastMetrics?: Record<string, unknown>;
}

export const JobSyncStateSchema = SchemaFactory.createForClass(JobSyncState);
