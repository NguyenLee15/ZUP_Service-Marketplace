import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'qs';

interface VnpayParams {
  amount: number;
  txnRef: string;
  orderInfo: string;
  returnUrl: string;
  ipAddress: string;
}

@Injectable()
export class VnpayService {
  private readonly logger = new Logger('VnpayService');
  private readonly vnpUrl: string;
  private readonly tmnCode: string;
  private readonly hashSecret: string;

  constructor(private configService: ConfigService) {
    this.vnpUrl =
      this.configService.get<string>('VNPAY_URL') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE') || '';
    this.hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || '';
  }

  createPaymentUrl(params: VnpayParams): string {
    if (!this.tmnCode || !this.hashSecret) {
      throw new BadRequestException({
        message: 'Thiếu cấu hình VNPAY_TMN_CODE hoặc VNPAY_HASH_SECRET',
      });
    }

    const date = new Date();
    const createDate = this.formatDate(date);

    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: params.txnRef,
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: (params.amount * 100).toString(),
      vnp_ReturnUrl: params.returnUrl,
      vnp_IpAddr: params.ipAddress,
      vnp_CreateDate: createDate,
    };

    const sortedParams = this.sortAndEncodeObject(vnpParams);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams.vnp_SecureHash = signed;
    return `${this.vnpUrl}?${querystring.stringify(sortedParams, { encode: false })}`;
  }

  verifyIpn(query: Record<string, string>): {
    isValid: boolean;
    amount: number;
    txnRef: string;
    responseCode: string;
  } {
    const secureHash = query.vnp_SecureHash;
    const params = { ...query };
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const sortedParams = this.sortAndEncodeObject(params);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return {
      isValid: secureHash === signed,
      amount: parseInt(query.vnp_Amount) / 100,
      txnRef: query.vnp_TxnRef,
      responseCode: query.vnp_ResponseCode,
    };
  }

  private sortAndEncodeObject(obj: Record<string, string>): Record<string, string> {
    return Object.keys(obj)
      .sort()
      .reduce((result: Record<string, string>, key) => {
        result[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
        return result;
      }, {});
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }
}
