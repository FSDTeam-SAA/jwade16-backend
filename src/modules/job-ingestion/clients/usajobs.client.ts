import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FetchPageResult } from '../job-ingestion.types';
import { JobNormalizerService } from '../job-normalizer.service';

interface UsaJobsResponse {
  SearchResult?: {
    SearchResultCountAll?: number;
    SearchResultItems?: Array<{
      MatchedObjectDescriptor?: Record<string, unknown>;
    }>;
  };
}

@Injectable()
export class UsaJobsClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly userAgent: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly normalizer: JobNormalizerService,
  ) {
    this.baseUrl =
      this.configService.get<string>('jobIngestion.usajobs.baseUrl') ??
      'https://data.usajobs.gov/api/search';
    this.apiKey =
      this.configService.get<string>('jobIngestion.usajobs.apiKey') ?? '';
    this.userAgent =
      this.configService.get<string>('jobIngestion.usajobs.userAgent') ??
      'jwade16-job-ingestion';
  }

  async fetchPage(page: number, perPage: number): Promise<FetchPageResult> {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'USAJobs API key is missing. Set JOB_INGESTION_USAJOBS_API_KEY.',
      );
    }

    const query = new URLSearchParams({
      ResultsPerPage: String(perPage),
      Page: String(page),
    });

    const response = await fetch(`${this.baseUrl}?${query.toString()}`, {
      headers: {
        'Authorization-Key': this.apiKey,
        Host: 'data.usajobs.gov',
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`USAJobs API request failed with ${response.status}`);
    }

    const payload = (await response.json()) as UsaJobsResponse;
    const searchResult = payload.SearchResult;
    const items = searchResult?.SearchResultItems ?? [];
    const total = Number(searchResult?.SearchResultCountAll ?? 0);

    const jobs = items
      .map((item) => item.MatchedObjectDescriptor ?? {})
      .map((job) => this.normalizer.normalizeUsaJobs(job))
      .filter((job): job is NonNullable<typeof job> => job !== null);

    return {
      jobs,
      hasNextPage: page * perPage < total,
    };
  }
}
