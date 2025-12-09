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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request, Response } from 'express';
import { sendResponse } from '../../common/utils/sendResponse.js';
import type { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        phone: { type: 'string' },
        // Add other properties from UpdateUserDto as needed
      },
    },
  })
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
