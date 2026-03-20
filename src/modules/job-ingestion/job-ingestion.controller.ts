import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { sendResponse } from '../../common/utils/sendResponse.js';
import { JobIngestionService } from './job-ingestion.service';
import { JobSource } from './job-ingestion.types';

@Controller('job-ingestion')
export class JobIngestionController {
  constructor(private readonly jobIngestionService: JobIngestionService) {}

  @Public()
  @Post('sync')
  async sync(
    @Query('source') source: JobSource | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.jobIngestionService.sync(source);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Job ingestion sync completed',
      data: result,
    });
  }

  @Public()
  @Get('status')
  async getStatus(
    @Query('source') source: JobSource | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const status = await this.jobIngestionService.getStatus(source);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Job ingestion status retrieved successfully',
      data: status,
    });
  }

  @Public()
  @Post('sync/all')
  async syncAll(@Res() res: Response): Promise<void> {
    const result = await this.jobIngestionService.sync();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'All sources synced successfully',
      data: result,
    });
  }
}
