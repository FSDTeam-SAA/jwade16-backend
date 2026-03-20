import { Injectable } from '@nestjs/common';
import { NormalizedJob } from './job-ingestion.types';

@Injectable()
export class JobNormalizerService {
  normalizeAdzuna(input: Record<string, unknown>): NormalizedJob | null {
    const id = this.toString(input.id);
    const title = this.toString(input.title);

    if (!id || !title) {
      return null;
    }

    const company = this.toObject(input.company);
    const location = this.toObject(input.location);

    return {
      source: 'adzuna',
      externalJobId: id,
      title,
      companyName: this.toString(company.display_name) ?? 'Unknown',
      location: this.toString(location.display_name),
      description: this.toString(input.description),
      applyUrl: this.toString(input.redirect_url),
      postedAt: this.toDate(input.created),
      salaryMin: this.toNumber(input.salary_min),
      salaryMax: this.toNumber(input.salary_max),
      salaryCurrency: this.toString(input.salary_currency),
      metadata: {
        category: this.toObject(input.category),
      },
      raw: input,
    };
  }

  normalizeUsaJobs(input: Record<string, unknown>): NormalizedJob | null {
    const id = this.toString(input.PositionID);
    const title = this.toString(input.PositionTitle);

    if (!id || !title) {
      return null;
    }

    const organization = this.toString(input.OrganizationName) ?? 'Unknown';
    const location = this.toString(input.PositionLocationDisplay);
    const details = this.toObject(this.toObject(input.UserArea).Details);
    const applyUris = Array.isArray(input.ApplyURI)
      ? input.ApplyURI.filter((uri): uri is string => typeof uri === 'string')
      : [];

    return {
      source: 'usajobs',
      externalJobId: id,
      title,
      companyName: organization,
      location,
      description: this.toString(input.QualificationSummary),
      applyUrl: applyUris[0] ?? this.toString(input.PositionURI),
      postedAt: this.toDate(input.PublicationStartDate),
      salaryMin: this.toNumber(input.PositionRemunerationMin),
      salaryMax: this.toNumber(input.PositionRemunerationMax),
      salaryCurrency: 'USD',
      remoteType: this.toString(details.RemoteIndicator),
      employmentType: this.toString(input.PositionSchedule),
      metadata: {
        department: this.toString(input.DepartmentName),
        organization: this.toString(input.OrganizationName),
        securityClearance: this.toString(details.SecurityClearanceRequired),
      },
      raw: input,
    };
  }

  normalizeGreenhouse(
    input: Record<string, unknown>,
    company: string,
  ): NormalizedJob | null {
    const id = this.toString(input.id);
    const title = this.toString(input.title);

    if (!id || !title) {
      return null;
    }

    const location = this.toObject(input.location);

    return {
      source: 'greenhouse',
      externalJobId: id,
      title,
      companyName: company,
      location: this.toString(location.name),
      description: this.toString(input.content),
      applyUrl: this.toString(input.absolute_url),
      postedAt:
        this.toDate(input.updated_at) ?? this.toDate(input.first_published),
      metadata: {
        internalJobId: this.toNumber(input.internal_job_id),
      },
      raw: input,
    };
  }

  private toObject(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : {};
  }

  private toString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : undefined;
  }

  private toNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value.replaceAll(',', ''));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return undefined;
  }

  private toDate(value: unknown): Date | undefined {
    if (typeof value !== 'string' || !value.trim()) {
      return undefined;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
}
