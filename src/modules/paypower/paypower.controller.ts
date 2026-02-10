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

  @Public()
  @Get()
  getPaypowerReport(@Query('score') score: string, @Res() res: Response): void {
    const scoreNumber = parseInt(score, 10);
    if (isNaN(scoreNumber)) {
      throw new BadRequestException('Invalid score provided.');
    }

    const report: Record<string, unknown> | null =
      this.paypowerService.getPaypowerReport(scoreNumber) as Record<
        string,
        unknown
      > | null;
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
    const scoreNumber = parseInt(score, 10);
    if (isNaN(scoreNumber)) {
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
    const scoreNumber = parseInt(score, 10);
    if (isNaN(scoreNumber)) {
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
