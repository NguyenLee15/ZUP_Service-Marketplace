import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { RedisService } from '../../shared/redis/redis.service';
import { BookingCommissionService } from './booking-commission.service';
import { BookingExecutionService } from './booking-execution.service';
import { BookingSharedService } from './booking-shared.service';
import { BookingStatePolicy } from './booking-state.policy';

function file(name: string): Express.Multer.File {
  return {
    fieldname: 'resultFiles',
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

describe('BookingExecutionService completion compensation', () => {
  let service: BookingExecutionService;
  let cloudinary: { uploadFile: jest.Mock; cleanupFiles: jest.Mock };
  let prisma: { $transaction: jest.Mock };

  beforeEach(() => {
    cloudinary = {
      uploadFile: jest.fn(),
      cleanupFiles: jest.fn().mockResolvedValue({ failedPublicIds: [] }),
    };
    prisma = { $transaction: jest.fn() };
    service = new BookingExecutionService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryService,
      {} as RedisService,
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
      { assertTransition: jest.fn() },
      {} as BookingCommissionService,
    );
  });

  it('cleans completed images when a later upload fails', async () => {
    cloudinary.uploadFile
      .mockResolvedValueOnce({ url: 'https://cdn/1', publicId: 'result-1' })
      .mockRejectedValueOnce(new Error('upload failed'));

    await expect(
      service.completeWork(8, 42, [file('one.jpg'), file('two.jpg')]),
    ).rejects.toThrow('upload failed');

    expect(cloudinary.cleanupFiles).toHaveBeenCalledWith(['result-1']);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('cleans all images when completion persistence fails', async () => {
    cloudinary.uploadFile
      .mockResolvedValueOnce({ url: 'https://cdn/1', publicId: 'result-1' })
      .mockResolvedValueOnce({ url: 'https://cdn/2', publicId: 'result-2' });
    prisma.$transaction.mockRejectedValue(new Error('database failed'));

    await expect(
      service.completeWork(8, 42, [file('one.jpg'), file('two.jpg')]),
    ).rejects.toThrow('database failed');

    expect(cloudinary.cleanupFiles).toHaveBeenCalledWith([
      'result-1',
      'result-2',
    ]);
  });
});
