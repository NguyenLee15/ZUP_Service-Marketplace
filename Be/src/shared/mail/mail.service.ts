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
      subject: 'Mã xác thực OTP - Zup',
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 24px; text-align: center;">
              <span style="color: white; font-size: 32px; font-weight: 900; letter-spacing: 4px;">ZUP</span>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin-top: 0;">Xác thực tài khoản</h2>
              <p style="color: #4b5563; font-size: 16px;">Mã OTP của bạn là:</p>
              <div style="background: #f3f4f6; padding: 24px; text-align: center; border-radius: 8px; margin: 24px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #2563eb;">${otp}</span>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.</p>
            </div>
          </div>
        `,
      consoleText: `OTP for ${email}: ${otp}`,
    });
  }

  /** Gửi link đặt lại mật khẩu */
  async sendPasswordResetLink(email: string, resetLink: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Đặt lại mật khẩu - Zup',
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 24px; text-align: center;">
              <span style="color: white; font-size: 32px; font-weight: 900; letter-spacing: 4px;">ZUP</span>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin-top: 0;">Đặt lại mật khẩu</h2>
              <p style="color: #4b5563; font-size: 16px;">Nhấn nút dưới đây để đặt lại mật khẩu của bạn:</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Đặt lại mật khẩu
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">Link có hiệu lực trong 15 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
            </div>
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
      subject: 'Chào mừng bạn đến với Zup',
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 24px; text-align: center;">
              <span style="color: white; font-size: 32px; font-weight: 900; letter-spacing: 4px;">ZUP</span>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin-top: 0;">Chào mừng ${fullName}!</h2>
              <p style="color: #4b5563; font-size: 16px;">Tài khoản nhân viên của bạn đã được tạo thành công. Thông tin đăng nhập:</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; color: #1f2937;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 0; color: #1f2937;"><strong>Mật khẩu:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${password}</span></p>
              </div>
              <p style="color: #e11d48; font-size: 14px; margin-bottom: 0;">Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu tiên để bảo mật tài khoản.</p>
            </div>
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
