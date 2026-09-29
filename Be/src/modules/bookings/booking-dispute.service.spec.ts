import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { JobsService } from '../../shared/jobs/jobs.service';
import { BookingCommissionService } from './booking-commission.service';
import { BookingDisputeService } from './booking-dispute.service';
import { BookingSharedService } from './booking-shared.service';
import { BookingStatePolicy } from './booking-state.policy';

function file(name: string): Express.Multer.File {
  return {
    fieldname: 'evidenceFiles',
    originalname: name,
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 10,
    destination: '',
    filename: name,
    path: '',
    buffer: Buffer.from('image'),
    stream: undefined as never,
  };
}

describe('BookingDisputeService evidence compensation', () => {
  let service: BookingDisputeService;
  let cloudinary: { uploadFile: jest.Mock; cleanupFiles: jest.Mock };
  let prisma: { $transaction: jest.Mock };

  beforeEach(() => {
    cloudinary = {
      uploadFile: jest.fn(),
      cleanupFiles: jest.fn().mockResolvedValue({ failedPublicIds: [] }),
    };
    prisma = {
      $transaction: jest.fn(),
    };
    service = new BookingDisputeService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryService,
      { enqueue: jest.fn() } as unknown as JobsService,
      { assertTransition: jest.fn() },
      {} as BookingCommissionService,
      {
        checkBooking: jest.fn().mockResolvedValue({
          id: 42,
          bookingCode: 'BK-42',
          customerId: 7,
          providerId: 8,
          status: BookingStatus.IN_PROGRESS,
        }),
        addStatusHistory: jest.fn(),
        notify: jest.fn(),
      } as unknown as BookingSharedService,
    );
  });

  it('cleans already uploaded evidence when a later upload fails', async () => {
    cloudinary.uploadFile
      .mockResolvedValueOnce({ url: 'https://cdn/1', publicId: 'dispute-1' })
      .mockRejectedValueOnce(new Error('upload failed'));

    await expect(
      service.customerDispute(7, 42, { reason: 'bad result' }, [
        file('one.jpg'),
        file('two.jpg'),
      ]),
    ).rejects.toThrow('upload failed');

    expect(cloudinary.cleanupFiles).toHaveBeenCalledWith(['dispute-1']);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('cleans evidence when the dispute transaction fails', async () => {
    cloudinary.uploadFile.mockResolvedValue({
      url: 'https://cdn/1',
      publicId: 'dispute-1',
    });
    prisma.$transaction.mockRejectedValue(new BadRequestException('race'));

    await expect(
      service.customerDispute(7, 42, { reason: 'bad result' }, [
        file('one.jpg'),
      ]),
    ).rejects.toThrow('race');

    expect(cloudinary.cleanupFiles).toHaveBeenCalledWith(['dispute-1']);
  });

  it('returns a controlled error when evidence cleanup fails', async () => {
    cloudinary.uploadFile.mockResolvedValue({
      url: 'https://cdn/1',
      publicId: 'dispute-1',
    });
    cloudinary.cleanupFiles.mockResolvedValue({
      failedPublicIds: ['dispute-1'],
    });
    prisma.$transaction.mockRejectedValue(new Error('database failed'));

    await expect(
      service.customerDispute(7, 42, { reason: 'bad result' }, [
        file('one.jpg'),
      ]),
    ).rejects.toMatchObject({
      response: {
        code: 'ASSET_COMPENSATION_FAILED',
      },
    });
  });
});
