import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { BookingCommissionService } from './booking-commission.service';
import { BookingSharedService } from './booking-shared.service';
import { BookingStatePolicy } from './booking-state.policy';
import { BookingQuotationService } from './booking-quotation.service';

const file = (name: string): Express.Multer.File => ({
  fieldname: 'surveyFiles',
  originalname: name,
  encoding: '7bit',
  mimetype: 'image/jpeg',
  size: 3,
  destination: '',
  filename: name,
  path: '',
  buffer: Buffer.from('img'),
  stream: undefined as never,
});

describe('BookingQuotationService upload/persistence boundary', () => {
  const booking = {
    id: 42,
    customerId: 7,
    providerId: 8,
    bookingCode: 'BK-42',
    status: BookingStatus.ACCEPTED,
    providerAcceptedAt: new Date(),
    surveyorName: 'Surveyor',
    providerArrivedAt: new Date(),
  };

  const createService = () => {
    const tx = {
      quotation: { create: jest.fn().mockResolvedValue({ id: 12 }) },
      quotationItem: { createMany: jest.fn() },
      bookingAttachment: { createMany: jest.fn() },
      booking: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest
          .fn()
          .mockResolvedValue({ ...booking, status: BookingStatus.QUOTED }),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (value: typeof tx) => unknown) =>
        callback(tx),
      ),
      quotation: {
        findUnique: jest.fn().mockResolvedValue({ id: 12, quotationItems: [] }),
      },
    };
    const cloudinary = {
      uploadFile: jest.fn(),
      cleanupFiles: jest.fn().mockResolvedValue({ failedPublicIds: [] }),
    };
    const shared = {
      checkBooking: jest.fn().mockResolvedValue(booking),
      addStatusHistory: jest.fn(),
      notify: jest.fn(),
    };
    const service = new BookingQuotationService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryService,
      shared as unknown as BookingSharedService,
      { assertTransition: jest.fn() } as unknown as BookingStatePolicy,
      {
        getCurrentCommissionRate: jest.fn().mockResolvedValue(8.5),
      } as unknown as BookingCommissionService,
    );
    return { service, prisma, tx, cloudinary };
  };

  const dto = {
    estimatedTime: '2 hours',
    items: [{ name: 'Repair', unit: 'job', price: 1000, quantity: 1 }],
  };

  it('does not open a transaction when a later upload fails', async () => {
    const { service, prisma, cloudinary } = createService();
    cloudinary.uploadFile
      .mockResolvedValueOnce({ url: 'https://cdn/1', publicId: 'asset-1' })
      .mockRejectedValueOnce(new Error('upload failed'));

    await expect(
      service.sendQuote(8, 42, dto, [file('one.jpg'), file('two.jpg')]),
    ).rejects.toThrow('upload failed');
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(cloudinary.cleanupFiles).toHaveBeenCalledWith(['asset-1']);
  });

  it('cleans uploaded assets when quotation persistence fails', async () => {
    const { service, prisma, cloudinary } = createService();
    cloudinary.uploadFile
      .mockResolvedValueOnce({ url: 'https://cdn/1', publicId: 'asset-1' })
      .mockResolvedValueOnce({ url: 'https://cdn/2', publicId: 'asset-2' });
    prisma.$transaction.mockRejectedValue(new Error('database failed'));

    await expect(
      service.sendQuote(8, 42, dto, [file('one.jpg'), file('two.jpg')]),
    ).rejects.toThrow('database failed');
    expect(cloudinary.cleanupFiles).toHaveBeenCalledWith([
      'asset-1',
      'asset-2',
    ]);
  });
});
