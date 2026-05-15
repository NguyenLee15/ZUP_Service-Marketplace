import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  provider: process.env.MAIL_PROVIDER || 'console',
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587', 10),
  user: process.env.MAIL_USER || '',
  pass: process.env.MAIL_PASS || '',
  from:
    process.env.MAIL_FROM || '"Service Marketplace" <noreply@marketplace.vn>',
  brevoApiKey: process.env.BREVO_API_KEY || '',
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@marketplace.vn',
  brevoSenderName: process.env.BREVO_SENDER_NAME || 'Service Marketplace',
}));
