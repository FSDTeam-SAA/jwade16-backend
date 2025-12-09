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
  < div >
  <h3>Your OTP Code </h3>
    < p style = "font-size: 20px; font-weight: bold;" > ${otp} </p>
      < p > This OTP will expire in 10 minutes.</p>
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
