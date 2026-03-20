import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmbeddingOccupationService } from '../embedding-occupation/embedding-occupation.service';
import { AdzunaClient } from './clients/adzuna.client';
import { GreenhouseClient } from './clients/greenhouse.client';
import { UsaJobsClient } from './clients/usajobs.client';
import { JobIngestionController } from './job-ingestion.controller';
import { JobPosting, JobPostingSchema } from './job-posting.schema';
import { JobNormalizerService } from './job-normalizer.service';
import { JobIngestionService } from './job-ingestion.service';
import { JobSyncState, JobSyncStateSchema } from './job-sync-state.schema';
import { JobIngestionScheduler } from './job-ingestion.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobPosting.name, schema: JobPostingSchema },
      { name: JobSyncState.name, schema: JobSyncStateSchema },
    ]),
  ],
  controllers: [JobIngestionController],
  providers: [
    JobIngestionService,
    JobNormalizerService,
    AdzunaClient,
    UsaJobsClient,
    GreenhouseClient,
    EmbeddingOccupationService,
    JobIngestionScheduler,
  ],
  exports: [JobIngestionService],
})
export class JobIngestionModule {}
