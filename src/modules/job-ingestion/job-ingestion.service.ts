import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdzunaClient } from './clients/adzuna.client';
import { GreenhouseClient } from './clients/greenhouse.client';
import { UsaJobsClient } from './clients/usajobs.client';
import { JobPosting, JobPostingDocument } from './job-posting.schema';
import { JobSyncState, JobSyncStateDocument } from './job-sync-state.schema';
import { EmbeddingOccupationService } from '../embedding-occupation/embedding-occupation.service';
import { JobSource, NormalizedJob, SyncMetrics } from './job-ingestion.types';

interface SourceConfig {
  perPage: number;
  maxPages: number;
  concurrency: number;
  retryAttempts: number;
  retryBaseDelayMs: number;
}

@Injectable()
export class JobIngestionService {
  private readonly logger = new Logger(JobIngestionService.name);

  constructor(
    @InjectModel(JobPosting.name)
    private readonly jobPostingModel: Model<JobPostingDocument>,
    @InjectModel(JobSyncState.name)
    private readonly jobSyncStateModel: Model<JobSyncStateDocument>,
    private readonly configService: ConfigService,
    private readonly adzunaClient: AdzunaClient,
    private readonly usaJobsClient: UsaJobsClient,
    private readonly greenhouseClient: GreenhouseClient,
    private readonly embeddingOccupationService: EmbeddingOccupationService,
  ) {}

  async sync(source?: JobSource): Promise<SyncMetrics[]> {
    if (source) {
      return [await this.syncSource(source)];
    }

    const results: SyncMetrics[] = [];
    for (const item of this.getSources()) {
      results.push(await this.syncSource(item));
    }

    return results;
  }

  async getStatus(source?: JobSource): Promise<JobSyncStateDocument[]> {
    if (source) {
      const state = await this.jobSyncStateModel.findOne({ source }).exec();
      return state ? [state] : [];
    }

    return this.jobSyncStateModel.find().sort({ updatedAt: -1 }).exec();
  }

  private getSources(): JobSource[] {
    return ['adzuna', 'usajobs', 'greenhouse'];
  }

  private getSourceConfig(source: JobSource): SourceConfig {
    return {
      perPage:
        this.configService.get<number>(`jobIngestion.sync.${source}.perPage`) ??
        this.configService.get<number>('jobIngestion.sync.defaultPerPage') ??
        100,
      maxPages:
        this.configService.get<number>(
          `jobIngestion.sync.${source}.maxPages`,
        ) ??
        this.configService.get<number>('jobIngestion.sync.defaultMaxPages') ??
        10,
      concurrency:
        this.configService.get<number>(
          `jobIngestion.sync.${source}.concurrency`,
        ) ??
        this.configService.get<number>(
          'jobIngestion.sync.defaultConcurrency',
        ) ??
        2,
      retryAttempts:
        this.configService.get<number>('jobIngestion.sync.retryAttempts') ?? 3,
      retryBaseDelayMs:
        this.configService.get<number>('jobIngestion.sync.retryBaseDelayMs') ??
        500,
    };
  }

  private async syncSource(source: JobSource): Promise<SyncMetrics> {
    const startedAt = new Date();
    await this.updateState(source, {
      source,
      status: 'running',
      lastRunStartedAt: startedAt,
      lastError: undefined,
    });

    const metrics: SyncMetrics = {
      source,
      fetched: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      pagesProcessed: 0,
      errors: [],
      startedAt,
      finishedAt: startedAt,
    };

    try {
      switch (source) {
        case 'adzuna':
          await this.ingestPagedSource(
            source,
            async (page, perPage) => this.adzunaClient.fetchPage(page, perPage),
            metrics,
          );
          break;
        case 'usajobs':
          await this.ingestPagedSource(
            source,
            async (page, perPage) =>
              this.usaJobsClient.fetchPage(page, perPage),
            metrics,
          );
          break;
        case 'greenhouse':
          await this.ingestGreenhouse(metrics);
          break;
      }

      metrics.finishedAt = new Date();

      await this.updateState(source, {
        source,
        status: 'succeeded',
        lastRunCompletedAt: metrics.finishedAt,
        lastSuccessfulSyncAt: metrics.finishedAt,
        lastMetrics: this.toMetricsRecord(metrics),
      });

      const embeddingHook = this.embeddingOccupationService as {
        handleJobIngestionCompleted: (input: {
          source: string;
          inserted: number;
          updated: number;
          fetched: number;
        }) => Promise<void>;
      };

      await embeddingHook.handleJobIngestionCompleted({
        source,
        inserted: metrics.inserted,
        updated: metrics.updated,
        fetched: metrics.fetched,
      });

      return metrics;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown ingestion error';
      metrics.errors.push(message);
      metrics.finishedAt = new Date();

      await this.updateState(source, {
        source,
        status: 'failed',
        lastRunCompletedAt: metrics.finishedAt,
        lastError: message,
        lastMetrics: this.toMetricsRecord(metrics),
      });

      this.logger.error(`[${source}] sync failed`, error);
      return metrics;
    }
  }

  private async ingestPagedSource(
    source: JobSource,
    fetcher: (
      page: number,
      perPage: number,
    ) => Promise<{
      jobs: NormalizedJob[];
      hasNextPage: boolean;
    }>,
    metrics: SyncMetrics,
  ): Promise<void> {
    const config = this.getSourceConfig(source);
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage && currentPage <= config.maxPages) {
      const pages = this.buildPageBatch(
        currentPage,
        config.maxPages,
        config.concurrency,
      );

      const batch = await Promise.all(
        pages.map((page) =>
          this.withRetry(
            () => fetcher(page, config.perPage),
            config.retryAttempts,
            config.retryBaseDelayMs,
          ),
        ),
      );

      for (const response of batch) {
        metrics.pagesProcessed += 1;
        metrics.fetched += response.jobs.length;

        const result = await this.bulkUpsert(response.jobs);
        metrics.inserted += result.inserted;
        metrics.updated += result.updated;
        metrics.skipped += result.skipped;
      }

      hasNextPage = batch.at(-1)?.hasNextPage ?? false;
      currentPage += pages.length;

      await this.updateState(source, {
        source,
        lastPage: currentPage - 1,
      });
    }
  }

  private async ingestGreenhouse(metrics: SyncMetrics): Promise<void> {
    const source: JobSource = 'greenhouse';
    const config = this.getSourceConfig(source);
    const state = await this.jobSyncStateModel.findOne({ source }).exec();
    const companies = this.greenhouseClient.getCompanies();

    for (const company of companies) {
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage && page <= config.maxPages) {
        const response = await this.withRetry(
          () =>
            this.greenhouseClient.fetchCompanyPage(
              company,
              page,
              config.perPage,
            ),
          config.retryAttempts,
          config.retryBaseDelayMs,
        );

        const incrementalJobs = this.filterIncrementalJobs(
          response.jobs,
          state?.lastSuccessfulSyncAt,
        );

        metrics.pagesProcessed += 1;
        metrics.fetched += response.jobs.length;

        const result = await this.bulkUpsert(incrementalJobs);
        metrics.inserted += result.inserted;
        metrics.updated += result.updated;
        metrics.skipped +=
          result.skipped + (response.jobs.length - incrementalJobs.length);

        hasNextPage = response.hasNextPage;
        page += 1;
      }
    }
  }

  private filterIncrementalJobs(
    jobs: NormalizedJob[],
    lastSuccessfulSyncAt?: Date,
  ): NormalizedJob[] {
    if (!lastSuccessfulSyncAt) {
      return jobs;
    }

    return jobs.filter((job) => {
      if (!job.postedAt) {
        return true;
      }
      return job.postedAt > lastSuccessfulSyncAt;
    });
  }

  private buildPageBatch(
    currentPage: number,
    maxPages: number,
    concurrency: number,
  ): number[] {
    const pageBatch: number[] = [];

    for (let i = 0; i < concurrency; i += 1) {
      const page = currentPage + i;
      if (page > maxPages) {
        break;
      }
      pageBatch.push(page);
    }

    return pageBatch;
  }

  private async bulkUpsert(
    jobs: NormalizedJob[],
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    if (jobs.length === 0) {
      return { inserted: 0, updated: 0, skipped: 0 };
    }

    const now = new Date();
    const uniqueMap = new Map<string, NormalizedJob>();

    for (const job of jobs) {
      if (!job.externalJobId) {
        continue;
      }
      uniqueMap.set(`${job.source}:${job.externalJobId}`, job);
    }

    const deduped = [...uniqueMap.values()];
    const skipped = jobs.length - deduped.length;

    const bulkOps = deduped.map((job) => ({
      updateOne: {
        filter: {
          source: job.source,
          externalJobId: job.externalJobId,
        },
        update: {
          $set: {
            ...job,
            lastSeenAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        upsert: true,
      },
    }));

    const result = await this.jobPostingModel.bulkWrite(bulkOps, {
      ordered: false,
    });

    const inserted = result.upsertedCount ?? 0;
    const updated = result.modifiedCount ?? 0;

    return {
      inserted,
      updated,
      skipped,
    };
  }

  private async updateState(
    source: JobSource,
    patch: Partial<JobSyncState>,
  ): Promise<void> {
    await this.jobSyncStateModel
      .updateOne(
        { source },
        {
          $set: patch,
          $setOnInsert: { source },
        },
        { upsert: true },
      )
      .exec();
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    attempts: number,
    baseDelayMs: number,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt >= attempts) {
          break;
        }

        const delay = baseDelayMs * attempt;
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private toMetricsRecord(metrics: SyncMetrics): Record<string, unknown> {
    return {
      source: metrics.source,
      fetched: metrics.fetched,
      inserted: metrics.inserted,
      updated: metrics.updated,
      skipped: metrics.skipped,
      pagesProcessed: metrics.pagesProcessed,
      errors: metrics.errors,
      startedAt: metrics.startedAt,
      finishedAt: metrics.finishedAt,
    };
  }
}
