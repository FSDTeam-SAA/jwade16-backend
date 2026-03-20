import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FetchPageResult } from '../job-ingestion.types';
import { JobNormalizerService } from '../job-normalizer.service';

@Injectable()
export class AdzunaClient {
  private readonly baseUrl: string;
  private readonly country: string;
  private readonly appId: string;
  private readonly appKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly normalizer: JobNormalizerService,
  ) {
    this.baseUrl =
      this.configService.get<string>('jobIngestion.adzuna.baseUrl') ??
      'https://api.adzuna.com/v1/api/jobs';
    this.country =
      this.configService.get<string>('jobIngestion.adzuna.country') ?? 'us';
    this.appId =
      this.configService.get<string>('jobIngestion.adzuna.appId') ?? '';
    this.appKey =
      this.configService.get<string>('jobIngestion.adzuna.appKey') ?? '';
  }

  async fetchPage(page: number, perPage: number): Promise<FetchPageResult> {
    if (!this.appId || !this.appKey) {
      throw new InternalServerErrorException(
        'Adzuna credentials are missing. Set JOB_INGESTION_ADZUNA_APP_ID and JOB_INGESTION_ADZUNA_APP_KEY.',
      );
    }

    const searchParams = new URLSearchParams({
      app_id: this.appId,
      app_key: this.appKey,
      results_per_page: String(perPage),
      content_type: 'application/json',
    });

    const endpoint = `${this.baseUrl}/${this.country}/search/${page}?${searchParams.toString()}`;
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Adzuna API request failed with ${response.status}`);
    }

    const payload = (await response.json()) as {
      results?: Record<string, unknown>[];
      count?: number;
    };

    const jobs = (payload.results ?? [])
      .map((job) => this.normalizer.normalizeAdzuna(job))
      .filter((job): job is NonNullable<typeof job> => job !== null);

    const total = payload.count ?? 0;
    const hasNextPage = page * perPage < total;

    return {
      jobs,
      hasNextPage,
    };
  }
}
