import {
  Body,
  Controller,
  Post,
  Res,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { sendResponse } from '../../common/utils/sendResponse.js';
import type { Response } from 'express';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
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

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('login')
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
  @Post('forgot-password')
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
  @Post('reset/password/verify-otp')
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
  @Post('reset-password')
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
  async changePassword(
    @Req() req: Request,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
    @Res() res: Response,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = (req as any).user?.userId;

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
