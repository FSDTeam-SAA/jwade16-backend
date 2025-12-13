import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Occupation, OccupationDocument } from './occupation.schema';
import * as fs from 'fs';
import * as path from 'path';

interface RawOccupation {
  AREA?: number;
  AREA_TITLE?: string;
  AREA_TYPE?: number;
  PRIM_STATE?: string;
  NAICS?: string;
  NAICS_TITLE?: string;
  I_GROUP?: string;
  OWN_CODE?: number;
  OCC_CODE?: string;
  OCC_TITLE?: string;
  O_GROUP?: string;
  TOT_EMP?: string | number;
  EMP_PRSE?: number;
  JOBS_1000?: number;
  LOC_QUOTIENT?: number;
  PCT_TOTAL?: number;
  PCT_RPT?: number;
  H_MEAN?: number;
  A_MEAN?: string | number;
  MEAN_PRSE?: number;
  H_PCT10?: number;
  H_PCT25?: number;
  H_MEDIAN?: number;
  H_PCT75?: number;
  H_PCT90?: number;
  A_PCT10?: string | number;
  A_PCT25?: string | number;
  A_MEDIAN?: string | number;
  A_PCT75?: string | number;
  A_PCT90?: string | number;
}

@Injectable()
export class OccupationService {
  constructor(
    @InjectModel(Occupation.name)
    private occupationModel: Model<OccupationDocument>,
  ) {}

  async importFromJson(): Promise<{ inserted: number }> {
    const filePath = path.join(process.cwd(), 'jword salary data.json');

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData) as RawOccupation[];

    const formattedData = jsonData.map((item) => ({
      ...item,
      TOT_EMP: this.toNumber(item.TOT_EMP),
      A_MEAN: this.toNumber(item.A_MEAN),
      A_PCT10: this.toNumber(item.A_PCT10),
      A_PCT25: this.toNumber(item.A_PCT25),
      A_MEDIAN: this.toNumber(item.A_MEDIAN),
      A_PCT75: this.toNumber(item.A_PCT75),
      A_PCT90: this.toNumber(item.A_PCT90),
    }));

    const result = await this.occupationModel.insertMany(formattedData, {
      ordered: false,
    });

    return { inserted: result.length };
  }

  private toNumber(value: string | number | null | undefined): number | null {
    if (!value) return null;
    return Number(String(value).replace(/,/g, ''));
  }
}
