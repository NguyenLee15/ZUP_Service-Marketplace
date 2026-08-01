import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../shared/ai/ai.service';
import { BookingIntentService } from './booking-intent.service';

describe('BookingIntentService', () => {
  let service: BookingIntentService;
  let prismaService: any;
  let aiService: any;

  beforeEach(async () => {
    prismaService = {
      serviceCategory: {
        findFirst: jest.fn(),
      },
      service: {
        findMany: jest.fn(),
      },
    };

    aiService = {
      extractBookingIntent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingIntentService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AiService, useValue: aiService },
      ],
    }).compile();

    service = module.get<BookingIntentService>(BookingIntentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractIntent', () => {
    it('should successfully extract intent via Gemini AI when available', async () => {
      aiService.extractBookingIntent.mockResolvedValue({
        categoryName: 'Sửa máy giặt',
        keywords: ['máy giặt', 'kêu to', 'không vắt'],
        summary: 'Máy giặt phát tiếng kêu lớn và dừng vắt',
        urgency: 'HIGH',
        estimatedBudgetMin: 200000,
        estimatedBudgetMax: 500000,
      });

      prismaService.serviceCategory.findFirst.mockResolvedValue({
        id: 1,
        name: 'Sửa máy giặt',
      });

      prismaService.service.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Sửa máy giặt tại nhà',
          description: 'Sửa máy giặt kêu to',
          referencePrice: 300000,
          avgRating: 4.8,
          category: { id: 1, name: 'Sửa máy giặt' },
        },
      ]);

      const result = await service.extractIntent({
        prompt: 'Máy giặt nhà tôi kêu to không vắt được',
      });

      expect(result.isAiExtracted).toBe(true);
      expect(result.intent.categoryName).toBe('Sửa máy giặt');
      expect(result.intent.urgency).toBe('HIGH');
      expect(result.matchedCategory).toEqual({
        id: 1,
        name: 'Sửa máy giặt',
      });
      expect(result.suggestedServices).toHaveLength(1);
      expect(result.suggestedServices[0].id).toBe(1);
    });

    it('should fallback to keyword matching when AI extraction fails or returns null', async () => {
      aiService.extractBookingIntent.mockResolvedValue(null);

      prismaService.serviceCategory.findFirst.mockResolvedValue(null);
      prismaService.service.findMany.mockResolvedValue([]);

      const result = await service.extractIntent({
        prompt: 'Sửa chập điện khẩn cấp',
      });

      expect(result.isAiExtracted).toBe(false);
      expect(result.intent.urgency).toBe('HIGH');
      expect(result.intent.keywords).toContain('chập');
      expect(result.matchedCategory).toBeNull();
      expect(result.suggestedServices).toEqual([]);
    });
  });
});
