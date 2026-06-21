import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '../../common/events/notification-events';
import { KycStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { ErrorCodes } from '../../common/errors/error-codes';

@Injectable()
export class KycService {
  private readonly logger = new Logger('KycService');

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Provider nộp KYC — upload CCCD mặt trước/sau + chân dung + chứng chỉ (optional)
   */
  async submitKyc(
    providerId: number,
    files: {
      cccdFront: Express.Multer.File;
      cccdBack: Express.Multer.File;
      portrait: Express.Multer.File;
      certificate?: Express.Multer.File;
    },
    ip?: string,
  ) {
    // Kiểm tra đã có KYC PENDING chưa
    const existingPending = await this.prisma.kycProfile.findFirst({
      where: { providerId, status: KycStatus.PENDING },
    });

    if (existingPending) {
      throw new BadRequestException({
        code: ErrorCodes.DUPLICATE_KYC,
        message: 'Bạn đã có yêu cầu KYC đang chờ duyệt',
      });
    }

    // Upload files lên Cloudinary
    const [cccdFront, cccdBack, portrait] = await Promise.all([
      this.cloudinaryService.uploadFile(files.cccdFront.buffer, 'kyc'),
      this.cloudinaryService.uploadFile(files.cccdBack.buffer, 'kyc'),
      this.cloudinaryService.uploadFile(files.portrait.buffer, 'kyc'),
    ]);

    let certificateUrl: string | undefined;
    if (files.certificate) {
      const cert = await this.cloudinaryService.uploadFile(
        files.certificate.buffer,
        'kyc',
      );
      certificateUrl = cert.url;
    }

    // Tạo KYC record
    const kyc = await this.prisma.kycProfile.create({
      data: {
        providerId,
        cccdFrontUrl: cccdFront.url,
        cccdBackUrl: cccdBack.url,
        portraitUrl: portrait.url,
        certificateUrl,
        status: KycStatus.PENDING,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: providerId,
        action: 'SUBMIT_KYC',
        targetType: 'KYC_PROFILE',
        targetId: kyc.id,
        description: 'Nộp hồ sơ KYC',
        ipAddress: ip,
      },
    });

    // Gửi notification cho tất cả Admin + Staff
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] }, status: 'ACTIVE' },
      select: { id: true },
    });

    if (admins.length > 0) {
      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'NEW_KYC',
          title: 'Yêu cầu KYC mới',
          content: `Nhà cung cấp #${providerId} đã nộp yêu cầu xác minh danh tính`,
          referenceId: kyc.id,
        })),
      });
    }

    this.logger.log(`KYC submitted by provider ${providerId}`);

    return {
      data: kyc,
      message: 'Nộp KYC thành công. Vui lòng chờ admin duyệt.',
    };
  }

  /**
   * Lấy trạng thái KYC hiện tại
   */
  async getKycStatus(providerId: number) {
    const kyc = await this.prisma.kycProfile.findFirst({
      where: { providerId },
      orderBy: { id: 'desc' },
    });

    return {
      data: kyc || { status: null, message: 'Chưa nộp KYC' },
    };
  }

  /**
   * Admin/Staff duyệt KYC
   */
  async reviewKyc(
    reviewerId: number,
    kycId: number,
    action: 'APPROVE' | 'REJECT',
    reason?: string,
    ip?: string,
  ) {
    const kyc = await this.prisma.kycProfile.findUnique({
      where: { id: kycId },
    });

    if (!kyc) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Yêu cầu KYC không tồn tại',
      });
    }

    if (kyc.status !== KycStatus.PENDING) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Yêu cầu KYC này đã được xử lý',
      });
    }

    if (action === 'REJECT' && !reason) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Vui lòng nhập lý do từ chối',
      });
    }

    const newStatus =
      action === 'APPROVE' ? KycStatus.APPROVED : KycStatus.REJECTED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const up = await tx.kycProfile.update({
        where: { id: kycId },
        data: {
          status: newStatus,
          reviewedBy: reviewerId,
          rejectReason: action === 'REJECT' ? reason : null,
        },
      });

      // Nếu duyệt -> Tạo ví nếu chưa có
      if (action === 'APPROVE') {
        const existingWallet = await tx.providerWallet.findUnique({
          where: { providerId: kyc.providerId },
        });
        if (!existingWallet) {
          await tx.providerWallet.create({
            data: { providerId: kyc.providerId },
          });
        }
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: action === 'APPROVE' ? 'APPROVE_KYC' : 'REJECT_KYC',
          targetType: 'KYC_PROFILE',
          targetId: kycId,
          description:
            action === 'APPROVE'
              ? 'Duyệt KYC'
              : `Từ chối KYC. Lý do: ${reason}`,
          ipAddress: ip,
        },
      });

      return up;
    });

    // Gửi notification cho Provider
    const notifTitle =
      action === 'APPROVE' ? 'KYC đã được duyệt' : 'KYC bị từ chối';
    const notifContent =
      action === 'APPROVE'
        ? 'Chúc mừng! Danh tính của bạn đã được xác minh. Bạn có thể bắt đầu đăng dịch vụ.'
        : `Yêu cầu KYC bị từ chối. Lý do: ${reason}`;

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SEND, {
      userId: kyc.providerId,
      type: 'KYC_RESULT',
      title: notifTitle,
      content: notifContent,
      referenceId: kyc.id,
    });

    this.logger.log(`KYC #${kycId} ${action} by reviewer ${reviewerId}`);

    return {
      data: updated,
      message: action === 'APPROVE' ? 'Đã duyệt KYC' : 'Đã từ chối KYC',
    };
  }
}
