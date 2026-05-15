import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter?: nodemailer.Transporter;
  private readonly logger = new Logger('MailService');
  private readonly provider: string;

  constructor(private configService: ConfigService) {
    this.provider =
      this.configService.get<string>('mail.provider') || 'console';

    if (this.provider === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('mail.host'),
        port: this.configService.get<number>('mail.port'),
        secure: false,
        auth: {
          user: this.configService.get<string>('mail.user'),
          pass: this.configService.get<string>('mail.pass'),
        },
      });
    }
  }

  /** Gửi OTP xác thực email */
  async sendOtp(email: string, otp: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Mã xác thực OTP - Service Marketplace',
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #333;">Xác thực tài khoản</h2>
            <p>Mã OTP của bạn là:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.</p>
          </div>
        `,
      consoleText: `OTP for ${email}: ${otp}`,
    });
  }

  /** Gửi link đặt lại mật khẩu */
  async sendPasswordResetLink(email: string, resetLink: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Đặt lại mật khẩu - Service Marketplace',
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #333;">Đặt lại mật khẩu</h2>
            <p>Nhấn nút dưới đây để đặt lại mật khẩu:</p>
            <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Đặt lại mật khẩu
            </a>
            <p style="color: #666; font-size: 14px;">Link có hiệu lực trong 15 phút.</p>
          </div>
        `,
      consoleText: `Password reset link for ${email}: ${resetLink}`,
    });
  }

  /** Gửi thông tin đăng nhập cho staff mới */
  async sendStaffCredentials(
    email: string,
    fullName: string,
    password: string,
  ): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Chào mừng bạn đến Service Marketplace',
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #333;">Chào mừng ${fullName}!</h2>
            <p>Tài khoản nhân viên đã được tạo. Thông tin đăng nhập:</p>
            <ul>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Mật khẩu:</strong> ${password}</li>
            </ul>
            <p style="color: #e11d48; font-size: 14px;">Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu.</p>
          </div>
        `,
      consoleText: `Staff credentials for ${email}: ${password}`,
    });
  }

  private async sendMail(params: {
    to: string;
    subject: string;
    html: string;
    consoleText: string;
  }): Promise<void> {
    if (this.provider === 'console') {
      this.logger.log(
        `[MAIL console] ${params.subject} - ${params.consoleText}`,
      );
      return;
    }

    try {
      if (this.provider === 'brevo') {
        await this.sendBrevoMail(params);
        this.logger.log(`Email sent via Brevo to ${params.to}`);
        return;
      }

      if (!this.transporter) {
        throw new Error('SMTP transporter is not configured');
      }

      await this.transporter.sendMail({
        from: this.configService.get<string>('mail.from'),
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      this.logger.log(`Email sent via SMTP to ${params.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${params.to}`, error);
      throw error;
    }
  }

  private async sendBrevoMail(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const apiKey = this.configService.get<string>('mail.brevoApiKey');
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is required when MAIL_PROVIDER=brevo');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          email: this.configService.get<string>('mail.brevoSenderEmail'),
          name: this.configService.get<string>('mail.brevoSenderName'),
        },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Brevo email failed with HTTP ${response.status}: ${body}`,
      );
    }
  }
}
