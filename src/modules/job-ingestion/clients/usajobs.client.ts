import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FetchPageResult } from '../job-ingestion.types';
import { JobNormalizerService } from '../job-normalizer.service';

const REQUEST_TIMEOUT_MS = 15000;

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

    if (!this.userAgent?.includes('@')) {
      throw new InternalServerErrorException(
        'USAJobs User-Agent is missing/invalid. Set JOB_INGESTION_USAJOBS_USER_AGENT to your contact email (required by USAJobs).',
      );
    }

    const query = new URLSearchParams({
      ResultsPerPage: String(perPage),
      Page: String(page),
    });

    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}?${query.toString()}`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          'Authorization-Key': this.apiKey,
          Host: 'data.usajobs.gov',
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown network error';
      throw new Error(
        `USAJobs network request failed: ${message}. Check internet/firewall or proxy settings.`,
      );
    }

    if (!response.ok) {
      const errorBody = await response.text();
      const snippet = errorBody.replaceAll(/\s+/g, ' ').trim().slice(0, 180);
      const details = snippet ? `: ${snippet}` : '';
      if (response.status === 401) {
        throw new Error(
          `USAJobs API request failed with 401. Verify JOB_INGESTION_USAJOBS_API_KEY and JOB_INGESTION_USAJOBS_USER_AGENT (must be a valid contact email)${details}`,
        );
      }

      throw new Error(
        `USAJobs API request failed with ${response.status}${details}`,
      );
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
