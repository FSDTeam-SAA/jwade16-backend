import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PaypowerService } from './paypower.service';
import { Public } from '../../common/decorators/public.decorator';
import { sendResponse } from '../../common/utils/sendResponse.js';
import type { Response } from 'express';

@Controller('paypower')
export class PaypowerController {
  constructor(private readonly paypowerService: PaypowerService) {}

  private parseAnswers(answers?: string, context?: string): unknown {
    if (!answers && !context) {
      return undefined;
    }

    let parsedAnswers: unknown = answers;
    if (answers) {
      try {
        parsedAnswers = JSON.parse(answers) as unknown;
      } catch {
        parsedAnswers = answers;
      }
    }

    return {
      answers: parsedAnswers,
      context,
    };
  }

  @Public()
  @Get()
  async getPaypowerReport(
    @Query('score') score: string,
    @Query('answers') answers: string,
    @Query('context') context: string,
    @Res() res: Response,
  ): Promise<void> {
    const scoreNumber = Number.parseInt(score, 10);
    if (Number.isNaN(scoreNumber)) {
      throw new BadRequestException('Invalid score provided.');
    }

    const report = await Promise.resolve(
      this.paypowerService.getPaypowerReport(
        scoreNumber,
        this.parseAnswers(answers, context),
      ),
    );
    if (!report) {
      throw new NotFoundException('No report found for the given score.');
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Free paypower report retrieved successfully',
      data: report,
    });
  }

  @Public()
  @Get('pay')
  getPayReport(@Query('score') score: string, @Res() res: Response): void {
    const scoreNumber = Number.parseInt(score, 10);
    if (Number.isNaN(scoreNumber)) {
      throw new BadRequestException('Invalid score provided.');
    }

    const report: Record<string, unknown> | null =
      this.paypowerService.getPaidReport(scoreNumber) as Record<
        string,
        unknown
      > | null;
    if (!report) {
      throw new NotFoundException('No report found for the given score.');
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Paid paypower report retrieved successfully',
      data: report,
    });
  }

  @Public()
  @Get('paid')
  getPaidReportBreakdown(
    @Query('score') score: string,
    @Res() res: Response,
  ): void {
    const scoreNumber = Number.parseInt(score, 10);
    if (Number.isNaN(scoreNumber)) {
      throw new BadRequestException('Invalid score provided.');
    }

    const report: Record<string, unknown> | null =
      this.paypowerService.getPaidReport(scoreNumber) as Record<
        string,
        unknown
      > | null;
    if (!report) {
      throw new NotFoundException('No paid report found for the given score.');
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Paid paypower report retrieved successfully',
      data: report,
    });
  }
}
