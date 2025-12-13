import { Controller, Post } from '@nestjs/common';
import { OccupationService } from './occupation.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('occupations')
export class OccupationController {
  constructor(private readonly occupationService: OccupationService) {}

  @Public()
  @Post('import')
  importData() {
    console.log('Importing data...');
    return this.occupationService.importFromJson();
  }
}
