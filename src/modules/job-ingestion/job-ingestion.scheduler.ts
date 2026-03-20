import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { JobIngestionService } from './job-ingestion.service';

@Injectable()
export class JobIngestionScheduler {
  private readonly logger = new Logger(JobIngestionScheduler.name);
  private isRunning = false;

  constructor(private readonly jobIngestionService: JobIngestionService) {}

  @Cron('0 0 * * *', { name: 'daily-job-sync', timeZone: 'UTC' })
  async handleDailySync(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn(
        'Daily job sync skipped because a sync is already running.',
      );
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting daily job ingestion sync...');

    try {
      const result = await this.jobIngestionService.sync();
      this.logger.log(
        `Daily job ingestion sync completed. Runs: ${result.length}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Daily job ingestion sync failed: ${message}`);
    } finally {
      this.isRunning = false;
    }
  }
}
