import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('SMTP_HOST'),
      port: configService.get<number>('SMTP_PORT'),
      secure: false, // true if using 465
      auth: {
        user: configService.get<string>('SMTP_USER'),
        pass: configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendOtpMail(to: string, otp: string) {
    console.log('📧 Sending OTP email to:', to);
    console.log('🔑 OTP Code:', otp);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      await this.transporter.sendMail({
        from: `"No Reply" < ${process.env.SMTP_USER}> `,
        to,
        subject: 'Password Reset OTP',
        html: `
<div style="font-family: Arial, Helvetica, sans-serif; background:#f4f6f8; padding:40px 0;">
  <div style="max-width:500px; margin:0 auto; background:#ffffff; border-radius:8px; padding:30px; text-align:center; box-shadow:0 4px 10px rgba(0,0,0,0.05);">

    <h2 style="color:#333; margin-bottom:10px;">
      🔐 Verification Code
    </h2>

    <p style="color:#555; font-size:16px; margin-bottom:25px;">
      Use the following One Time Password (OTP) to complete your verification.
    </p>

    <div style="background:#f1f5f9; padding:15px 25px; border-radius:6px; display:inline-block; margin-bottom:20px;">
      <span style="font-size:28px; font-weight:bold; letter-spacing:5px; color:#2563eb;">
        ${otp}
      </span>
    </div>

    <p style="color:#666; font-size:14px;">
      This OTP will expire in <strong>10 minutes</strong>.
    </p>

    <hr style="border:none; border-top:1px solid #eee; margin:25px 0;" />

    <p style="font-size:13px; color:#888;">
      If you did not request this code, please ignore this email.
    </p>

    <p style="font-size:12px; color:#aaa; margin-top:20px;">
      © ${new Date().getFullYear()} COMPanion Pay. All rights reserved.
    </p>

  </div>
</div>
`,
      });
      console.log('✅ Email sent successfully');
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      console.log('⚠️  OTP is still valid, use it from the logs above');
      // Don't throw error in development - allow OTP to be used from logs
      // throw new InternalServerErrorException('Failed to send email');
    }
  }
}
