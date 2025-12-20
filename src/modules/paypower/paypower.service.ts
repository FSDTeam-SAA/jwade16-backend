import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PaypowerService {
  private readonly paypowerData: any;

  constructor() {
    const filePath = path.join(process.cwd(), 'paypowerScoreContent.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    this.paypowerData = JSON.parse(fileContent);
  }

  getPaypowerReport(score: number) {
    const report = this.paypowerData.payPowerReports.find((r) => {
      const [min, max] = r.scoreRange.split('-').map(Number);
      return score >= min && score <= max;
    });

    return report || null;
  }
}
