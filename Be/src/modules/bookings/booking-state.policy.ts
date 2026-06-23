import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';

type Transition = `${BookingStatus}->${BookingStatus}`;

const ALLOWED_TRANSITIONS = new Set<Transition>([
  `${BookingStatus.PENDING}->${BookingStatus.ACCEPTED}`,
  `${BookingStatus.PENDING}->${BookingStatus.QUOTED}`,
  `${BookingStatus.PENDING}->${BookingStatus.CANCELLED}`,
  `${BookingStatus.ACCEPTED}->${BookingStatus.QUOTED}`,
  `${BookingStatus.ACCEPTED}->${BookingStatus.CANCELLED}`,
  `${BookingStatus.QUOTED}->${BookingStatus.CONFIRMED}`,
  `${BookingStatus.QUOTED}->${BookingStatus.CANCELLED}`,
  `${BookingStatus.CONFIRMED}->${BookingStatus.IN_PROGRESS}`,
  `${BookingStatus.CONFIRMED}->${BookingStatus.CANCELLED}`,
  `${BookingStatus.IN_PROGRESS}->${BookingStatus.DONE}`,
  `${BookingStatus.DONE}->${BookingStatus.DISPUTED}`,
  `${BookingStatus.DISPUTED}->${BookingStatus.DONE}`,
  `${BookingStatus.DISPUTED}->${BookingStatus.CANCELLED}`,
]);

@Injectable()
export class BookingStatePolicy {
  assertTransition(from: BookingStatus, to: BookingStatus) {
    if (from === to) return;
    const transition: Transition = `${from}->${to}`;
    if (ALLOWED_TRANSITIONS.has(transition)) return;

    throw new BadRequestException({
      code: ErrorCodes.BOOKING_INVALID_STATE,
      message: `Không thể chuyển đơn hàng từ ${from} sang ${to}`,
    });
  }
}
