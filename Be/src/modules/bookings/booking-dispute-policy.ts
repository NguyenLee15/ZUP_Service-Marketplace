import { BadRequestException } from '@nestjs/common';
import { ErrorCodes } from '../../common/errors/error-codes';

export function assertPenaltyWithinBookingValue(
  penaltyAmount: number | undefined,
  acceptedQuotationTotal: unknown,
): void {
  if (penaltyAmount === undefined) return;

  if (
    acceptedQuotationTotal === null ||
    !Number.isFinite(Number(acceptedQuotationTotal))
  ) {
    throw new BadRequestException({
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Booking không có snapshot tài chính hợp lệ để tính tiền phạt.',
    });
  }

  if (penaltyAmount > Number(acceptedQuotationTotal)) {
    throw new BadRequestException({
      code: ErrorCodes.PENALTY_EXCEEDS_BOOKING_VALUE,
      message: 'Số tiền phạt không được vượt quá giá trị đơn hàng.',
    });
  }
}
