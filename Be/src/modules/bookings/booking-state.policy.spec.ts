import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { BookingStatePolicy } from './booking-state.policy';

describe('BookingStatePolicy', () => {
  const policy = new BookingStatePolicy();

  it('allows valid lifecycle transitions', () => {
    expect(() =>
      policy.assertTransition(BookingStatus.PENDING, BookingStatus.QUOTED),
    ).not.toThrow();
    expect(() =>
      policy.assertTransition(BookingStatus.QUOTED, BookingStatus.CONFIRMED),
    ).not.toThrow();
    expect(() =>
      policy.assertTransition(BookingStatus.IN_PROGRESS, BookingStatus.DONE),
    ).not.toThrow();
  });

  it('blocks invalid lifecycle transitions', () => {
    expect(() =>
      policy.assertTransition(BookingStatus.PENDING, BookingStatus.DONE),
    ).toThrow(BadRequestException);
  });
});
