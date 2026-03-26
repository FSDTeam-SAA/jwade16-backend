import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSelection, UserSelectionDocument } from './user-selection.schema';
import { CreateUserSelectionDto } from './dto/create-user-selection.dto';
import {
  Occupation,
  OccupationDocument,
} from '../../occupation/occupation.schema';
import {
  JobPosting,
  JobPostingDocument,
} from '../job-ingestion/job-posting.schema';

import { PaypowerService } from '../paypower/paypower.service';

type BenchmarkKey = 'A_PCT10' | 'A_MEDIAN' | 'A_PCT90';

interface SalaryBands {
  A_PCT10?: number;
  A_PCT25?: number;
  A_MEDIAN?: number;
  A_PCT75?: number;
  A_PCT90?: number;
}

export interface PayPowerScoreResult {
  _id: string;
  currentRole: string;
  experience: string;
  location: string;
  compensationRange: string;
  compensationValue: number;
  benchmarkKey: BenchmarkKey;
  benchmarkValue: number;
  payPowerScore: number;
  marketGap: string;
  salaryBands: {
    A_PCT10?: number;
    A_PCT25?: number;
    A_MEDIAN?: number;
    A_PCT75?: number;
    A_PCT90?: number;
  };
  payPowerReport: any;
}

@Injectable()
export class UserSelectionService {
  private readonly roleAliasRules: Array<{ match: RegExp; canonical: string }> =
    [
      {
        match: /\bprogram\s+examiner(s)?\b/i,
        canonical: 'Management Occupations',
      },
    ];

  constructor(
    @InjectModel(UserSelection.name)
    private readonly userSelectionModel: Model<UserSelectionDocument>,
    @InjectModel(Occupation.name)
    private readonly occupationModel: Model<OccupationDocument>,
    @InjectModel(JobPosting.name)
    private readonly jobPostingModel: Model<JobPostingDocument>,
    private readonly paypowerService: PaypowerService,
  ) {}

  async create(
    createUserSelectionDto: CreateUserSelectionDto,
  ): Promise<UserSelection> {
    const compensationValue = this.getCompensationValue(
      createUserSelectionDto.compensation,
    );

    const createdUserSelection = new this.userSelectionModel({
      ...createUserSelectionDto,
      compensationValue,
    });
    return createdUserSelection.save();
  }

  async findAll(): Promise<UserSelection[]> {
    return this.userSelectionModel.find().exec();
  }

  private calculatePayPowerScore(
    compensation: number,
    bands: SalaryBands,
  ): { score: number; marketGap: string } {
    const { A_PCT10, A_PCT25, A_MEDIAN, A_PCT75, A_PCT90 } = bands;

    let score: number;
    let marketGap: string;

    if (compensation < (A_PCT10 ?? 0)) {
      score = 15;
      marketGap = `${Math.round((((A_PCT10 ?? 0) - compensation) / (A_PCT10 ?? 1)) * 100)}% Below Market`;
    } else if (compensation < (A_PCT25 ?? 0)) {
      score = 30;
      marketGap = `${Math.round((((A_PCT25 ?? 0) - compensation) / (A_PCT25 ?? 1)) * 100)}% Below Market`;
    } else if (compensation < (A_MEDIAN ?? 0)) {
      score = 50;
      marketGap = `${Math.round((((A_MEDIAN ?? 0) - compensation) / (A_MEDIAN ?? 1)) * 100)}% Below Market`;
    } else if (compensation < (A_PCT75 ?? 0)) {
      score = 70;
      marketGap = 'At Market';
    } else if (compensation < (A_PCT90 ?? 0)) {
      score = 85;
      marketGap = 'Above Market';
    } else {
      score = 95;
      marketGap = 'Top 10% of Market';
    }

    return { score, marketGap };
  }

  async evaluatePayPower(
    dto: CreateUserSelectionDto,
  ): Promise<PayPowerScoreResult> {
    const compensationValue = this.getCompensationValue(dto.compensation);
    const occupation = await this.findOccupation(dto.currentRole);
    let effectiveBands = this.mergeSalaryBands(occupation, null);

    // Source priority:
    // 1) Occupation benchmark data (imported from jword salary data.json)
    // 2) job_postings salary bands from MongoDB (fallback only when needed)
    if (!effectiveBands.A_MEDIAN) {
      const postingBands = await this.deriveSalaryBandsFromJobPostings(
        dto.currentRole,
        dto.location,
      );
      effectiveBands = this.mergeSalaryBands(occupation, postingBands);
    }

    if (!effectiveBands.A_MEDIAN) {
      throw new NotFoundException(
        `No salary benchmark data found for ${dto.currentRole}`,
      );
    }

    const { score, marketGap } = this.calculatePayPowerScore(
      compensationValue,
      effectiveBands,
    );

    const benchmarkKey = this.getBenchmarkKey(dto.experience);
    const benchmarkValue = this.resolveBenchmarkValue(
      benchmarkKey,
      effectiveBands,
    );

    const payPowerReport = await this.paypowerService.getPaypowerReport(score, {
      currentRole: dto.currentRole,
      experience: dto.experience,
      location: dto.location,
      compensation: dto.compensation,
      lastRaise: dto.lastRaise,
      negotiateCurrentSalary: dto.negotiateCurrentSalary,
      discussTime: dto.discussTime,
      howConfident: dto.howConfident,
      email: dto.email,
      calculatedSalary: compensationValue,
      marketGap,
      benchmarkData: {
        A_PCT10: effectiveBands.A_PCT10,
        A_PCT25: effectiveBands.A_PCT25,
        A_MEDIAN: effectiveBands.A_MEDIAN,
        A_PCT75: effectiveBands.A_PCT75,
        A_PCT90: effectiveBands.A_PCT90,
      },
    });

    const createdSelection = await this.userSelectionModel.create({
      ...dto,
      compensationValue,
      payPowerScore: String(score),
      marketGap,
    });

    return {
      _id: createdSelection._id.toString(),
      currentRole: dto.currentRole,
      experience: dto.experience,
      location: dto.location,
      compensationRange: dto.compensation,
      compensationValue,
      benchmarkKey,
      benchmarkValue,
      payPowerScore: score,
      marketGap,
      salaryBands: {
        A_PCT10: effectiveBands.A_PCT10,
        A_PCT25: effectiveBands.A_PCT25,
        A_MEDIAN: effectiveBands.A_MEDIAN,
        A_PCT75: effectiveBands.A_PCT75,
        A_PCT90: effectiveBands.A_PCT90,
      },
      payPowerReport,
    };
  }

  private async findOccupation(title: string): Promise<Occupation | null> {
    const roleVariants = this.buildRoleVariants(title);

    for (const variant of roleVariants) {
      const exactRegex = new RegExp(`^${this.escapeRegex(variant)}$`, 'i');

      const national = await this.occupationModel
        .findOne({ OCC_TITLE: exactRegex, AREA: 99 })
        .exec();

      if (national) {
        return national;
      }

      const anyArea = await this.occupationModel
        .findOne({ OCC_TITLE: exactRegex })
        .exec();

      if (anyArea) {
        return anyArea;
      }
    }

    const tokens = this.getRoleTokens(title);
    if (tokens.length > 0) {
      const tokenQuery = {
        $and: tokens.map((token) => ({
          OCC_TITLE: {
            $regex: String.raw`\b${this.escapeRegex(token)}s?\b`,
            $options: 'i',
          },
        })),
      };

      const national = await this.occupationModel
        .findOne({ ...tokenQuery, AREA: 99 })
        .exec();
      if (national) {
        return national;
      }

      const anyArea = await this.occupationModel.findOne(tokenQuery).exec();
      if (anyArea) {
        return anyArea;
      }
    }

    return null;
  }

  private async deriveSalaryBandsFromJobPostings(
    role: string,
    location: string,
  ): Promise<SalaryBands | null> {
    const roleVariants = this.buildRoleVariants(role);
    const exactRegex = this.buildVariantRegex(roleVariants, true);
    const broadRegex = this.buildVariantRegex(roleVariants, false);

    const exactWithLocation = await this.collectSalaryPoints({
      title: exactRegex,
      location: { $regex: this.escapeRegex(location), $options: 'i' },
    });
    const exact =
      exactWithLocation.length >= 20
        ? exactWithLocation
        : await this.collectSalaryPoints({ title: exactRegex });

    const selected =
      exact.length >= 20
        ? exact
        : await this.collectSalaryPoints({ title: broadRegex });

    if (selected.length < 10) {
      return null;
    }

    return {
      A_PCT10: this.percentile(selected, 0.1),
      A_PCT25: this.percentile(selected, 0.25),
      A_MEDIAN: this.percentile(selected, 0.5),
      A_PCT75: this.percentile(selected, 0.75),
      A_PCT90: this.percentile(selected, 0.9),
    };
  }

  private async collectSalaryPoints(
    filter: Record<string, unknown>,
  ): Promise<number[]> {
    const rows = await this.jobPostingModel
      .find(
        {
          ...filter,
          $or: [{ salaryMin: { $gt: 0 } }, { salaryMax: { $gt: 0 } }],
        },
        { salaryMin: 1, salaryMax: 1, _id: 0 },
      )
      .limit(3000)
      .lean()
      .exec();

    return rows
      .map((row) => {
        const min = this.ensurePositiveNumber(row.salaryMin);
        const max = this.ensurePositiveNumber(row.salaryMax);

        if (min && max) {
          return Math.round((min + max) / 2);
        }

        return min ?? max;
      })
      .filter((value): value is number => typeof value === 'number');
  }

  private ensurePositiveNumber(value: unknown): number | undefined {
    return typeof value === 'number' && value > 0 ? value : undefined;
  }

  private percentile(values: number[], fraction: number): number | undefined {
    if (values.length === 0) {
      return undefined;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.max(
      0,
      Math.min(sorted.length - 1, Math.round((sorted.length - 1) * fraction)),
    );
    return sorted[index];
  }

  private mergeSalaryBands(
    occupation: Occupation | null,
    postingBands: SalaryBands | null,
  ): SalaryBands {
    const occupationBands: SalaryBands = {
      A_PCT10: occupation?.A_PCT10,
      A_PCT25: occupation?.A_PCT25,
      A_MEDIAN: occupation?.A_MEDIAN,
      A_PCT75: occupation?.A_PCT75,
      A_PCT90: occupation?.A_PCT90,
    };

    if (!postingBands) {
      return occupationBands;
    }

    return {
      A_PCT10: postingBands.A_PCT10 ?? occupationBands.A_PCT10,
      A_PCT25: postingBands.A_PCT25 ?? occupationBands.A_PCT25,
      A_MEDIAN: postingBands.A_MEDIAN ?? occupationBands.A_MEDIAN,
      A_PCT75: postingBands.A_PCT75 ?? occupationBands.A_PCT75,
      A_PCT90: postingBands.A_PCT90 ?? occupationBands.A_PCT90,
    };
  }

  private resolveBenchmarkValue(
    key: BenchmarkKey,
    salaryBands: SalaryBands,
  ): number {
    if (key === 'A_PCT10') {
      return salaryBands.A_PCT10 ?? salaryBands.A_MEDIAN ?? 0;
    }

    if (key === 'A_PCT90') {
      return salaryBands.A_PCT90 ?? salaryBands.A_MEDIAN ?? 0;
    }

    return salaryBands.A_MEDIAN ?? 0;
  }

  private getBenchmarkKey(experience: string): BenchmarkKey {
    const normalized = experience.toLowerCase();

    if (normalized.includes('0-2') || normalized.includes('entry')) {
      return 'A_PCT10';
    }

    if (
      normalized.includes('3-5') ||
      normalized.includes('mid') ||
      normalized.includes('intermediate')
    ) {
      return 'A_MEDIAN';
    }

    return 'A_PCT90';
  }

  private buildRoleVariants(role: string): string[] {
    const normalized = role.replaceAll(/\s+/g, ' ').trim();
    const withoutParentheses = normalized
      .replaceAll(/\([^)]*\)/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();
    const withoutSpecialChars = withoutParentheses
      .replaceAll(/[^\p{L}\p{N}\s\-/&]/gu, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();

    const variants = [normalized, withoutParentheses, withoutSpecialChars]
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    const aliasMatches = this.roleAliasRules
      .filter(({ match }) =>
        [normalized, withoutParentheses, withoutSpecialChars].some((value) =>
          match.test(value),
        ),
      )
      .map(({ canonical }) => canonical);

    variants.push(...aliasMatches);

    return [...new Set(variants)];
  }

  private buildVariantRegex(variants: string[], exact: boolean): RegExp {
    const pattern = variants.map((value) => this.escapeRegex(value)).join('|');
    return exact
      ? new RegExp(`^(?:${pattern})$`, 'i')
      : new RegExp(`(?:${pattern})`, 'i');
  }

  private getRoleTokens(role: string): string[] {
    const normalized = role
      .replaceAll(/\([^)]*\)/g, ' ')
      .toLowerCase()
      .replaceAll(/[^\p{L}\p{N}\s]/gu, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();

    if (!normalized) {
      return [];
    }

    const ignoredTokens = new Set(['detail', 'position', 'role', 'job']);
    return normalized
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !ignoredTokens.has(token));
  }

  private escapeRegex(value: string): string {
    const pattern = /[.*+?^${}()|[\]\\]/g;
    return value.replaceAll(pattern, String.raw`\$&`);
  }

  getCompensationValue(range: string): number {
    const normalized = range.toLowerCase().replaceAll(/\s+/g, '');

    const rangeRegex = /\$?(\d{1,3})(k)?-\$?(\d{1,3})(k)?\+?/i;
    const rangeMatch = rangeRegex.exec(normalized);
    if (rangeMatch) {
      const low = Number(rangeMatch[1]) * (rangeMatch[2] ? 1000 : 1);
      const high = Number(rangeMatch[3]) * (rangeMatch[4] ? 1000 : 1);
      return Math.round((low + high) / 2);
    }

    const lowerRegex = /under\$?(\d{1,3})(k)?/i;
    const lowerMatch = lowerRegex.exec(normalized);
    if (lowerMatch) {
      const cap = Number(lowerMatch[1]) * (lowerMatch[2] ? 1000 : 1);
      return Math.round(cap * 0.9);
    }

    const plusRegex = /\$?(\d{1,3})(k)?\+/i;
    const plusMatch = plusRegex.exec(normalized);
    if (plusMatch) {
      const base = Number(plusMatch[1]) * (plusMatch[2] ? 1000 : 1);
      return Math.round(base * 1.15);
    }

    const numeric = Number(range.replaceAll(/[^\d.]/g, ''));
    if (!Number.isNaN(numeric) && numeric > 0) {
      return numeric;
    }

    throw new BadRequestException(
      `Unable to parse compensation range: ${range}`,
    );
  }
}
