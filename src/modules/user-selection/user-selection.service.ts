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

import { PaypowerService } from '../paypower/paypower.service';

type BenchmarkKey = 'A_PCT10' | 'A_MEDIAN' | 'A_PCT90';

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
    A_MEDIAN?: number;
    A_PCT90?: number;
  };
  payPowerReport: any;
}

@Injectable()
export class UserSelectionService {
  constructor(
    @InjectModel(UserSelection.name)
    private userSelectionModel: Model<UserSelectionDocument>,
    @InjectModel(Occupation.name)
    private occupationModel: Model<OccupationDocument>,
    private paypowerService: PaypowerService,
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

  async evaluatePayPower(
    dto: CreateUserSelectionDto,
  ): Promise<PayPowerScoreResult> {
    const compensationValue = this.getCompensationValue(dto.compensation);
    const occupation = await this.findOccupation(dto.currentRole);

    const benchmarkKey = this.getBenchmarkKey(dto.experience);
    const benchmarkValue = occupation[benchmarkKey];

    if (!benchmarkValue) {
      throw new BadRequestException(
        `No ${benchmarkKey} benchmark available for role ${dto.currentRole}`,
      );
    }

    const payPowerScore = Math.round(
      (compensationValue / benchmarkValue) * 100,
    );

    const payPowerReport =
      this.paypowerService.getPaypowerReport(payPowerScore);

    const marketGapValue =
      compensationValue < benchmarkValue
        ? Math.round(
            ((benchmarkValue - compensationValue) / benchmarkValue) * 100,
          )
        : 0;

    const marketGap =
      compensationValue < benchmarkValue
        ? `${marketGapValue}% Below Market`
        : 'At or Above Market';

    // Persist this evaluation in the UserSelection collection
    const createdSelection = await this.userSelectionModel.create({
      ...dto,
      compensationValue,
      payPowerScore: String(payPowerScore),
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
      payPowerScore,
      marketGap,
      salaryBands: {
        A_PCT10: occupation.A_PCT10,
        A_MEDIAN: occupation.A_MEDIAN,
        A_PCT90: occupation.A_PCT90,
      },
      payPowerReport,
    };
  }

  private async findOccupation(title: string): Promise<Occupation> {
    const regex = new RegExp(`^${this.escapeRegex(title)}$`, 'i');

    const national = await this.occupationModel
      .findOne({ OCC_TITLE: regex, AREA: 99 })
      .exec();

    if (national) return national;

    const anyArea = await this.occupationModel
      .findOne({ OCC_TITLE: regex })
      .exec();

    if (!anyArea) {
      throw new NotFoundException(`No occupation data found for ${title}`);
    }

    return anyArea;
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

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private getCompensationValue(range: string): number {
    const normalized = range.toLowerCase().replace(/\s+/g, '');

    const rangeMatch = normalized.match(
      /\$?(\d{1,3})(k)?-\$?(\d{1,3})(k)?\+?/i,
    );
    if (rangeMatch) {
      const low = Number(rangeMatch[1]) * (rangeMatch[2] ? 1000 : 1);
      const high = Number(rangeMatch[3]) * (rangeMatch[4] ? 1000 : 1);
      return Math.round((low + high) / 2);
    }

    const lowerMatch = normalized.match(/under\$?(\d{1,3})(k)?/i);
    if (lowerMatch) {
      const cap = Number(lowerMatch[1]) * (lowerMatch[2] ? 1000 : 1);
      return Math.round(cap * 0.9);
    }

    const plusMatch = normalized.match(/\$?(\d{1,3})(k)?\+/i);
    if (plusMatch) {
      const base = Number(plusMatch[1]) * (plusMatch[2] ? 1000 : 1);
      return Math.round(base * 1.15);
    }

    const numeric = Number(range.replace(/[^\d.]/g, ''));
    if (!Number.isNaN(numeric) && numeric > 0) {
      return numeric;
    }

    throw new BadRequestException(
      `Unable to parse compensation range: ${range}`,
    );
  }
}
