export type JobSource = 'adzuna' | 'usajobs' | 'greenhouse';

export interface NormalizedJob {
  source: JobSource;
  externalJobId: string;
  title: string;
  companyName: string;
  location?: string;
  description?: string;
  applyUrl?: string;
  postedAt?: Date;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  remoteType?: string;
  employmentType?: string;
  metadata?: Record<string, unknown>;
  raw?: Record<string, unknown>;
}

export interface FetchPageResult {
  jobs: NormalizedJob[];
  hasNextPage: boolean;
}

export interface SyncMetrics {
  source: JobSource;
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  pagesProcessed: number;
  errors: string[];
  startedAt: Date;
  finishedAt: Date;
}
