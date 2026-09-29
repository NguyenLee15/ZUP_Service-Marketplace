import { BadRequestException } from '@nestjs/common';
import { assertPenaltyWithinBookingValue } from './booking-dispute-policy';

describe('booking dispute policy', () => {
  it('allows a penalty equal to the accepted quotation total', () => {
    expect(() => assertPenaltyWithinBookingValue(250000, 250000)).not.toThrow();
  });

  it('rejects a penalty above the accepted quotation total', () => {
    expect(() => assertPenaltyWithinBookingValue(250001, 250000)).toThrow(
      BadRequestException,
    );
  });

  it('rejects a penalty when the booking has no financial snapshot', () => {
    expect(() => assertPenaltyWithinBookingValue(1, null)).toThrow(
      BadRequestException,
    );
  });

  it('allows an omitted penalty for a non-penalty resolution', () => {
    expect(() =>
      assertPenaltyWithinBookingValue(undefined, null),
    ).not.toThrow();
  });
});
