import { Injectable, Logger } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingSharedService } from './booking-shared.service';
import { BookingStatePolicy } from './booking-state.policy';

export const PROVIDER_ACCEPTANCE_TIMEOUT_MS = 3 * 60 * 1000;

@Injectable()
export class BookingTimeoutService {
  private readonly logger = new Logger(BookingTimeoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shared: BookingSharedService,
    private readonly bookingStatePolicy: BookingStatePolicy,
  ) {}

  async reconcilePendingBookingSideEffects(limit = 50) {
    const recentSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        createdAt: { gte: recentSince },
        providerResponseDeadline: { not: null },
      },
      select: {
        id: true,
        bookingCode: true,
        customerId: true,
        providerId: true,
        serviceId: true,
      },
      orderBy: { id: 'asc' },
      take: Math.min(Math.max(limit, 1), 100),
    });

    let repaired = 0;
    for (const booking of pendingBookings) {
      try {
        const [notification, conversation] = await Promise.all([
          this.prisma.notification.findFirst({
            where: {
              userId: booking.providerId,
              type: 'NEW_BOOKING',
              referenceId: booking.id,
            },
            select: { id: true },
          }),
          this.prisma.conversation.findUnique({
            where: { bookingId: booking.id },
            select: { id: true },
          }),
        ]);

        let changed = false;
        if (!conversation) {
          await this.shared.linkConversationToBooking(
            booking.id,
            booking.customerId,
            booking.providerId,
            booking.serviceId,
          );
          changed = true;
        }
        if (!notification) {
          await this.shared.notify(
            booking.providerId,
            'NEW_BOOKING',
            'Đơn hàng mới',
            `Bạn nhận được đơn hàng mới #${booking.bookingCode}`,
            booking.id,
          );
          changed = true;
        }
        if (changed) repaired += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Failed to reconcile booking #${booking.id} side effects: ${message}`,
        );
      }
    }

    return repaired;
  }

  async expirePendingProviderAcceptances() {
    const now = new Date();
    const overdueBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        providerAcceptedAt: null,
        providerResponseDeadline: { lte: now },
      },
      select: { id: true },
      take: 50,
    });

    let expired = 0;
    for (const booking of overdueBookings) {
      if (await this.expireProviderAcceptance(booking.id)) expired += 1;
    }

    return expired;
  }

  async expireProviderAcceptance(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingCode: true,
        customerId: true,
        providerId: true,
        status: true,
        providerAcceptedAt: true,
        providerResponseDeadline: true,
      },
    });

    if (
      !booking ||
      booking.status !== BookingStatus.PENDING ||
      booking.providerAcceptedAt
    ) {
      return false;
    }

    const deadline =
      booking.providerResponseDeadline ??
      new Date(Date.now() - PROVIDER_ACCEPTANCE_TIMEOUT_MS);
    if (deadline.getTime() > Date.now()) return false;

    this.bookingStatePolicy.assertTransition(
      BookingStatus.PENDING,
      BookingStatus.CANCELLED,
    );

    const result = await this.prisma.booking.updateMany({
      where: {
        id: bookingId,
        status: BookingStatus.PENDING,
        providerAcceptedAt: null,
      },
      data: { status: BookingStatus.CANCELLED },
    });

    if (result.count === 0) return false;

    const note = 'Quá 3 phút nhà cung cấp chưa nhận đơn';
    await this.shared.addStatusHistory(
      bookingId,
      'PENDING',
      'CANCELLED',
      booking.providerId,
      note,
    );

    await this.shared.notify(
      booking.customerId,
      'PROVIDER_ACCEPTANCE_TIMEOUT',
      'Thợ chưa nhận đơn',
      `Đơn #${booking.bookingCode}: Quá 3 phút chưa được nhận. Bạn có thể tìm thợ khác.`,
      bookingId,
    );

    await this.shared.notify(
      booking.providerId,
      'BOOKING_ACCEPTANCE_EXPIRED',
      'Đơn đã quá hạn nhận',
      `Đơn #${booking.bookingCode} đã tự hủy vì quá 3 phút chưa nhận.`,
      bookingId,
    );

    return true;
  }

  scheduleProviderAcceptanceTimeout(bookingId: number) {
    const timeout = setTimeout(() => {
      void this.expireProviderAcceptance(bookingId).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to expire booking #${bookingId}: ${message}`);
      });
    }, PROVIDER_ACCEPTANCE_TIMEOUT_MS + 1000);

    timeout.unref?.();
  }
}
