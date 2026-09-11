import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  DisputeStatus,
  WalletTransactionType,
} from '@prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { JobName, JobsService } from '../../shared/jobs/jobs.service';
import { BookingCommissionService } from './booking-commission.service';
import { BookingSharedService } from './booking-shared.service';
import { BookingStatePolicy } from './booking-state.policy';
import { DisputeDto, ResolveDisputeDto } from './dto/bookings.dto';

@Injectable()
export class BookingDisputeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly jobsService: JobsService,
    private readonly bookingStatePolicy: BookingStatePolicy,
    private readonly bookingCommissionService: BookingCommissionService,
    private readonly shared: BookingSharedService,
  ) {}

  async customerDispute(
    customerId: number,
    bookingId: number,
    dto: DisputeDto,
    files?: Express.Multer.File[],
  ) {
    const booking = await this.shared.checkBooking(bookingId, {
      customerId,
      status: [BookingStatus.IN_PROGRESS, BookingStatus.DONE],
    });

    this.bookingStatePolicy.assertTransition(
      booking.status,
      BookingStatus.DISPUTED,
    );
    const { updated, dispute } = await this.prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.DISPUTED },
      });

      const createdDispute = await tx.dispute.create({
        data: {
          bookingId,
          raisedBy: customerId,
          reason: dto.reason,
          status: DisputeStatus.PENDING,
        },
      });

      await this.shared.addStatusHistory(
        bookingId,
        booking.status,
        'DISPUTED',
        customerId,
        dto.reason,
        tx,
      );

      return { updated: updatedBooking, dispute: createdDispute };
    });

    if (files && files.length > 0) {
      for (const file of files) {
        const uploaded = await this.cloudinaryService.uploadFile(
          file.buffer,
          'disputes',
        );
        await this.prisma.disputeEvidence.create({
          data: {
            disputeId: dispute.id,
            type: file.mimetype.startsWith('video') ? 'VIDEO' : 'IMAGE',
            fileUrl: uploaded.url,
            uploadedBy: customerId,
          },
        });
      }
    }

    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] }, status: 'ACTIVE' },
      select: { id: true },
    });
    for (const admin of admins) {
      await this.shared.notify(
        admin.id,
        'NEW_DISPUTE',
        'Khiếu nại mới',
        `Đơn #${booking.bookingCode}: ${dto.reason}`,
        bookingId,
      );
    }
    await this.shared.notify(
      booking.providerId,
      'BOOKING_DISPUTED',
      'Đơn hàng bị khiếu nại',
      `Đơn #${booking.bookingCode}: ${dto.reason}`,
      bookingId,
    );

    await this.jobsService.enqueue(JobName.AnalyzeDispute, {
      disputeId: dispute.id,
      reason: dto.reason,
    });

    return { data: { booking: updated, dispute }, message: 'Đã gửi khiếu nại' };
  }

  async resolveDispute(
    adminId: number,
    disputeId: number,
    dto: ResolveDisputeDto,
    ipAddress?: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: true },
    });

    if (!dispute) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Khiếu nại không tồn tại',
      });
    }
    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATUS,
        message: 'Khiếu nại đã được giải quyết',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          resolutionAction: dto.resolutionAction,
          resolutionReason: dto.resolutionReason,
          assignedTo: adminId,
        },
      });

      if (dto.resolutionAction === 'COMPLETE') {
        await tx.booking.update({
          where: { id: dispute.bookingId },
          data: {
            status: BookingStatus.DONE,
            completedAt: dispute.booking.completedAt || new Date(),
            autoCompletedAt: new Date(),
          },
        });

        await this.bookingCommissionService.deductCommission(
          dispute.bookingId,
          adminId,
          tx,
        );

        await this.shared.addStatusHistory(
          dispute.bookingId,
          BookingStatus.DISPUTED,
          BookingStatus.DONE,
          adminId,
          `Phán quyết tranh chấp: Hoàn thành đơn hàng. ${dto.resolutionReason || ''}`.trim(),
          tx,
        );
      } else if (dto.resolutionAction === 'PENALIZE') {
        await tx.booking.update({
          where: { id: dispute.bookingId },
          data: {
            status: BookingStatus.CANCELLED,
          },
        });

        if (dto.penaltyAmount) {
          const wallet = await tx.providerWallet.findUnique({
            where: { providerId: dispute.booking.providerId },
          });

          if (wallet) {
            const updatedWallet = await tx.providerWallet.update({
              where: { id: wallet.id },
              data: { balance: { decrement: dto.penaltyAmount } },
            });

            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                amount: -dto.penaltyAmount,
                type: WalletTransactionType.PENALTY,
                status: 'SUCCESS',
                bookingId: dispute.bookingId,
                disputeId: dispute.id,
              },
            });

            if (
              Number(updatedWallet.balance) < 0 &&
              !updatedWallet.isRestricted
            ) {
              await tx.providerWallet.update({
                where: { id: updatedWallet.id },
                data: { isRestricted: true },
              });
            }
          }
        }

        await this.shared.addStatusHistory(
          dispute.bookingId,
          BookingStatus.DISPUTED,
          BookingStatus.CANCELLED,
          adminId,
          `Phán quyết tranh chấp: Phạt vi phạm & Hủy đơn. ${dto.resolutionReason || ''}`.trim(),
          tx,
        );
      }

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: `RESOLVE_DISPUTE_${dto.resolutionAction}`,
          targetType: 'DISPUTE',
          targetId: disputeId,
          description: dto.resolutionReason,
          ipAddress: ipAddress || null,
        },
      });
    });

    const booking = dispute.booking;
    await this.shared.notify(
      booking.customerId,
      'DISPUTE_RESOLVED',
      'Khiếu nại đã được giải quyết',
      `Đơn #${booking.bookingCode}: ${dto.resolutionReason}`,
      booking.id,
    );
    await this.shared.notify(
      booking.providerId,
      'DISPUTE_RESOLVED',
      'Khiếu nại đã được giải quyết',
      `Đơn #${booking.bookingCode}: ${dto.resolutionReason}`,
      booking.id,
    );

    return { message: 'Đã giải quyết tranh chấp' };
  }
}
