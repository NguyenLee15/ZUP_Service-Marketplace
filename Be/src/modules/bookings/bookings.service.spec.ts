import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { AiService } from '../../shared/ai/ai.service';
import { RedisService } from '../../shared/redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JobsService } from '../../shared/jobs/jobs.service';

describe('BookingsService', () => {
  let service: BookingsService;

  const mockPrisma: any = {
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
    },
    notification: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
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

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, status: 'ACTIVE' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CloudinaryService, useValue: mockCloudinary },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: AiService, useValue: mockAi },
        { provide: RedisService, useValue: mockRedis },
        { provide: JobsService, useValue: mockJobs },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
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
        } as any,
      ];
      const result = await service.completeWork(10, 1, mockFiles);

      expect(result.data.status).toBe(BookingStatus.DONE);
      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BookingStatus.DONE,
            completedAt: expect.any(Date),
            autoCompletedAt: null,
          }),
        }),
      );
    });
  });
});
