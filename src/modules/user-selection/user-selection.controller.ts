import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UserSelectionService } from './user-selection.service';
import { CreateUserSelectionDto } from './dto/create-user-selection.dto';
import { sendResponse } from '../../common/utils/sendResponse';
import { Public } from '../../common/decorators/public.decorator';

@Controller('user-selection')
export class UserSelectionController {
  constructor(private readonly userSelectionService: UserSelectionService) {}

  @Public()
  @Post()
  async create(
    @Body() createUserSelectionDto: CreateUserSelectionDto,
    @Res() res: Response,
  ) {
    const data = await this.userSelectionService.create(createUserSelectionDto);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'User selection created successfully',
      data,
    });
  }

  @Public()
  @Get()
  async findAll(@Res() res: Response) {
    const data = await this.userSelectionService.findAll();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User selections retrieved successfully',
      data,
    });
  }
}
