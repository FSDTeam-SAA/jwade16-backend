import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FetchPageResult } from '../job-ingestion.types';
import { JobNormalizerService } from '../job-normalizer.service';

@Injectable()
export class GreenhouseClient {
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly normalizer: JobNormalizerService,
  ) {
    this.baseUrl =
      this.configService.get<string>('jobIngestion.greenhouse.baseUrl') ??
      'https://boards-api.greenhouse.io/v1/boards';
  }

  getCompanies(): string[] {
    const configured =
      this.configService.get<string>('jobIngestion.greenhouse.companies') ?? '';

    return configured
      .split(',')
      .map((company) => company.trim())
      .filter(Boolean);
  }

  async fetchCompanyPage(
    company: string,
    page: number,
    perPage: number,
  ): Promise<FetchPageResult> {
    const query = new URLSearchParams({
      content: 'true',
      page: String(page),
      per_page: String(perPage),
    });

    const endpoint = `${this.baseUrl}/${company}/jobs?${query.toString()}`;
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(
        `Greenhouse API request failed (${company}) with ${response.status}`,
      );
    }

    const payload = (await response.json()) as {
      jobs?: Record<string, unknown>[];
    };

    const jobs = (payload.jobs ?? [])
      .map((job) => this.normalizer.normalizeGreenhouse(job, company))
      .filter((job): job is NonNullable<typeof job> => job !== null);

    return {
      jobs,
      hasNextPage: (payload.jobs ?? []).length >= perPage,
    };
  }
}
