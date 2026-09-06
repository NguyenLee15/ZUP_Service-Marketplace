import { Test, TestingModule } from '@nestjs/testing';
import { BookingLifecycleService } from './booking-lifecycle.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { AiService } from '../../shared/ai/ai.service';
import { RedisService } from '../../shared/redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JobsService } from '../../shared/jobs/jobs.service';
import { BookingStatePolicy } from './booking-state.policy';
import { BookingCommissionService } from './booking-commission.service';
import { BookingTimeoutService } from './booking-timeout.service';
import { BookingSharedService } from './booking-shared.service';

type MockPrisma = {
  booking: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  bookingStatusHistory: {
    create: jest.Mock;
  };
  bookingAttachment: {
    create: jest.Mock;
    createMany: jest.Mock;
  };
  notification: {
    create: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
  $transaction: jest.Mock;
};

type BookingUpdateArg = {
  data: {
    status: BookingStatus;
    completedAt: Date;
    autoCompletedAt: Date | null;
  };
};

describe('BookingLifecycleService', () => {
  let service: BookingLifecycleService;

  const mockPrisma: MockPrisma = {
    booking: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    bookingStatusHistory: {
      create: jest.fn(),
    },
    bookingAttachment: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: MockPrisma) => unknown) => cb(mockPrisma)),
  };

  const mockCloudinary = {
    uploadFile: jest.fn().mockResolvedValue({ url: 'http://test.com/img.jpg' }),
  };

  const mockAi = {
    generateEmbedding: jest.fn(),
    analyzeResultImage: jest.fn().mockResolvedValue(true),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    exists: jest.fn().mockResolvedValue(false),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockJobs = {
    enqueue: jest.fn(),
  };

  const mockBookingStatePolicy = {
    assertTransition: jest.fn(),
  };

  const mockBookingCommissionService = {
    getCurrentCommissionRate: jest.fn().mockResolvedValue(8.5),
    deductCommission: jest.fn(),
  };

  const mockBookingTimeoutService = {
    expirePendingProviderAcceptances: jest.fn(),
    expireProviderAcceptance: jest.fn(),
    scheduleProviderAcceptanceTimeout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, status: 'ACTIVE' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingLifecycleService,
        BookingSharedService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CloudinaryService, useValue: mockCloudinary },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: AiService, useValue: mockAi },
        { provide: RedisService, useValue: mockRedis },
        { provide: JobsService, useValue: mockJobs },
        { provide: BookingStatePolicy, useValue: mockBookingStatePolicy },
        {
          provide: BookingCommissionService,
          useValue: mockBookingCommissionService,
        },
        { provide: BookingTimeoutService, useValue: mockBookingTimeoutService },
      ],
    }).compile();

    service = module.get<BookingLifecycleService>(BookingLifecycleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('customerConfirmQuote', () => {
    it('should throw NotFoundException if booking not found', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      await expect(service.customerConfirmQuote(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if status is not QUOTED', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 1,
        customerId: 1,
        providerId: 10,
        bookingCode: 'BK001',
        status: BookingStatus.PENDING,
      });
      await expect(service.customerConfirmQuote(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update status to CONFIRMED', async () => {
      const booking = {
        id: 1,
        customerId: 1,
        providerId: 10,
        bookingCode: 'BK001',
        status: BookingStatus.QUOTED,
      };
      mockPrisma.booking.findFirst.mockResolvedValue(booking);
      mockPrisma.booking.update.mockResolvedValue({
        ...booking,
        status: BookingStatus.CONFIRMED,
      });

      const result = await service.customerConfirmQuote(1, 1);
      expect(result.data.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  describe('completeWork', () => {
    it('should update status to DONE and set completedAt but NOT autoCompletedAt', async () => {
      const booking = {
        id: 1,
        customerId: 1,
        providerId: 10,
        bookingCode: 'BK001',
        status: BookingStatus.IN_PROGRESS,
        service: { name: 'Test Service' },
      };
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 10,
        status: 'ACTIVE',
      });
      mockPrisma.booking.findFirst.mockResolvedValue(booking);
      mockPrisma.booking.update.mockResolvedValue({
        ...booking,
        status: BookingStatus.DONE,
        completedAt: new Date(),
      });

      const mockFiles = [
        {
          originalname: 'test.jpg',
          buffer: Buffer.from('test'),
          mimetype: 'image/jpeg',
        } as Express.Multer.File,
      ];
      const result = await service.completeWork(10, 1, mockFiles);

      expect(result.data.status).toBe(BookingStatus.DONE);
      const updateMock = mockPrisma.booking.update as jest.Mock<
        unknown,
        [BookingUpdateArg]
      >;
      const updateArg = updateMock.mock.calls[0]?.[0];
      expect(updateArg.data.status).toBe(BookingStatus.DONE);
      expect(updateArg.data.completedAt).toBeInstanceOf(Date);
      expect(updateArg.data.autoCompletedAt).toBeNull();
    });
  });
});
