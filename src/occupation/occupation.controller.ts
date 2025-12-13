import { Controller, Get, Post } from '@nestjs/common';
import { OccupationService } from './occupation.service';
import { Public } from '../common/decorators/public.decorator';
import { ApiResponse } from '../common/utils/api-response.util';

@Controller('occupations')
export class OccupationController {
  constructor(private readonly occupationService: OccupationService) {}

  @Public()
  @Post('import')
  importData() {
    console.log('Importing data...');
    return this.occupationService.importFromJson();
  }

  @Public()
  @Get('titles')
  async getUniqueOccupationTitles() {
    const titles = await this.occupationService.getUniqueOccupationTitles();
    return ApiResponse.success(
      'Successfully retrieved unique occupation titles',
      titles,
    );
  }
}
