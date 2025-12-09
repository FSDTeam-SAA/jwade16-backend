import {
  Body,
  Controller,
  Patch,
  Req,
  UseGuards,
  Res,
  UseInterceptors,
  UploadedFile,
  Get,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request, Response } from 'express';
import { sendResponse } from '../../common/utils/sendResponse.js';
import type { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Res() res: Response,
  ) {
    const result = await this.userService.findAll(Number(page), Number(limit));
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Users retrieved successfully',
      data: result,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUser(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
    @Res() res: Response,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    const userId = (req.user as any)?.userId;
    console.log('userId', userId);
    const updatedUser = await this.userService.updateUser(
      userId,
      updateUserDto,
      avatar,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  }
}
