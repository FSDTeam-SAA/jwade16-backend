import {
  Body,
  Controller,
  Post,
  Res,
  Headers,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { sendResponse } from '../../common/utils/sendResponse.js';
import type { Response } from 'express';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const result = await this.authService.register(
      dto.firstName,
      dto.lastName,
      dto.email,
      dto.password,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(dto.email, dto.password);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Login successful',
      data: result,
    });
  }

  /*******************
   * FORGET PASSWORD *
   *******************/
  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async forgotPassword(@Body('email') email: string, @Res() res: Response) {
    const result = await this.authService.sendPasswordResetOtp(email);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.message,
    });
  }

  /**************
   * VERIFY OTP *
   **************/
  @Public()
  @Post('reset/password/verify-otp')
  @ApiOperation({ summary: 'Verify reset password OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtp_reset_password(@Body() body: any, @Res() res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const result = await this.authService.verifyResetOtp(body.email, body.otp);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.message,
      data: { resetToken: result.resetToken },
    });
  }

  /******************
   * RESET PASSWORD *
   ******************/
  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiBearerAuth()
  async resetPassword(
    @Headers('authorization') authHeader: string,
    @Body('newPassword') newPassword: string,
    @Res() res: Response,
  ) {
    // Authorization: Bearer <token>
    const token = authHeader?.split(' ')[1];
    const userId = await this.authService.verifyResetToken(token);
    const result = await this.authService.resetPasswordWithToken(
      userId,
      newPassword,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.message,
    });
  }

  // change password
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiBearerAuth()
  async changePassword(
    @Req() req: Request,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword:string,
    @Res() res: Response,
  ) {
    const userId = (req as { user?: { userId: string } }).user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not found in request');
    }

    const result = await this.authService.changePassword(
      userId,
      oldPassword,
      newPassword,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.message,
    });
  }
}
