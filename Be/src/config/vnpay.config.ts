import { registerAs } from '@nestjs/config';

export default registerAs('vnpay', () => ({
  tmnCode: process.env.VNPAY_TMN_CODE || '',
  hashSecret: process.env.VNPAY_HASH_SECRET || '',
  url:
    process.env.VNPAY_URL ||
    'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl:
    process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/return',
  ipnUrl:
    process.env.VNPAY_IPN_URL ||
    'http://localhost:3001/provider-wallets/vnpay/ipn',
}));
