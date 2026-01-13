import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CompensationService } from './compensation.service';
import { CreateCompensationDto } from './dto/create-compensation.dto';
import { UpdateCompensationDto } from './dto/update-compensation.dto';
import { ICompensation } from './compensation.schema';
import { Public } from '../../common/decorators/public.decorator';

@Controller('compensation')
export class CompensationController {
  constructor(private readonly compensationService: CompensationService) {}

  /**
   * Create a new compensation record
   * POST /api/v1/compensation
   */
  @Public()
  @Post()
  async create(
    @Body() createCompensationDto: CreateCompensationDto,
  ): Promise<{ message: string; data: ICompensation }> {
    const data = await this.compensationService.create(createCompensationDto);
    return {
      message: 'Compensation record created successfully',
      data,
    };
  }

  /**
   * Get all compensation records
   * GET /api/v1/compensation
   */
  @Public()
  @Get()
  async findAll(): Promise<{ message: string; data: ICompensation[] }> {
    const data = await this.compensationService.findAll();
    return {
      message: 'Compensation records retrieved successfully',
      data,
    };
  }

  /**
   * Search by company name
   * GET /api/v1/compensation/search/company?name=Google
   */
  @Public()
  @Get('search/company')
  async findByCompanyName(
    @Query('name') companyName: string,
  ): Promise<{ message: string; data: ICompensation[] }> {
    const data = await this.compensationService.findByCompanyName(companyName);
    return {
      message: 'Company search completed',
      data,
    };
  }

  /**
   * Search by job title
   * GET /api/v1/compensation/search/job-title?title=Senior
   */
  @Public()
  @Get('search/job-title')
  async findByJobTitle(
    @Query('title') jobTitle: string,
  ): Promise<{ message: string; data: ICompensation[] }> {
    const data = await this.compensationService.findByJobTitle(jobTitle);
    return {
      message: 'Job title search completed',
      data,
    };
  }

  /**
   * Search by location
   * GET /api/v1/compensation/search/location?city=San%20Francisco
   */
  @Public()
  @Get('search/location')
  async findByLocation(
    @Query('city') location: string,
  ): Promise<{ message: string; data: ICompensation[] }> {
    const data = await this.compensationService.findByLocation(location);
    return {
      message: 'Location search completed',
      data,
    };
  }

  /**
   * Search by job level
   * GET /api/v1/compensation/search/job-level?level=L5
   */
  @Public()
  @Get('search/job-level')
  async findByJobLevel(
    @Query('level') jobLevel: string,
  ): Promise<{ message: string; data: ICompensation[] }> {
    const data = await this.compensationService.findByJobLevel(jobLevel);
    return {
      message: 'Job level search completed',
      data,
    };
  }

  /**
   * Get compensation record by ID
   * GET /api/v1/compensation/:id
   */
  @Public()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<{ message: string; data: ICompensation }> {
    const data = await this.compensationService.findOne(id);
    return {
      message: 'Compensation record retrieved successfully',
      data,
    };
  }

  /**
   * Update compensation record
   * PATCH /api/v1/compensation/:id
   */
  @Public()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCompensationDto: UpdateCompensationDto,
  ): Promise<{ message: string; data: ICompensation }> {
    const data = await this.compensationService.update(
      id,
      updateCompensationDto,
    );
    return {
      message: 'Compensation record updated successfully',
      data,
    };
  }

  /**
   * Delete compensation record
   * DELETE /api/v1/compensation/:id
   */
  @Public()
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<{ message: string; data: ICompensation }> {
    const data = await this.compensationService.remove(id);
    return {
      message: 'Compensation record deleted successfully',
      data,
    };
  }
}
