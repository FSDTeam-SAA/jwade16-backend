import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FetchPageResult } from '../job-ingestion.types';
import { JobNormalizerService } from '../job-normalizer.service';

const REQUEST_TIMEOUT_MS = 15000;

@Injectable()
export class AdzunaClient {
  private readonly baseUrl: string;
  private readonly country: string;
  private readonly what: string;
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
    this.what =
      this.configService.get<string>('jobIngestion.adzuna.what') ??
      'software engineer';
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
      what: this.what,
      results_per_page: String(perPage),
      'content-type': 'application/json',
    });

    const endpoint = `${this.baseUrl}/${this.country}/search/${page}?${searchParams.toString()}`;

    let response: Response;

    try {
      response = await fetch(endpoint, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown network error';
      throw new Error(
        `Adzuna network request failed: ${message}. Check internet/firewall or set JOB_INGESTION_ADZUNA_BASE_URL.`,
      );
    }

    if (!response.ok) {
      const errorBody = await response.text();
      const snippet = errorBody.replaceAll(/\s+/g, ' ').trim().slice(0, 180);
      const details = snippet ? `: ${snippet}` : '';
      throw new Error(
        `Adzuna API request failed with ${response.status}${details}`,
      );
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
