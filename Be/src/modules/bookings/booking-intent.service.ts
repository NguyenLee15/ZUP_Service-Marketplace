import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../shared/ai/ai.service';
import {
  BookingIntentResponseDto,
  ExtractBookingIntentDto,
  SuggestedServiceItem,
} from './dto/booking-intent.dto';

@Injectable()
export class BookingIntentService {
  private readonly logger = new Logger(BookingIntentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async extractIntent(
    dto: ExtractBookingIntentDto,
  ): Promise<BookingIntentResponseDto> {
    const prompt = dto.prompt.trim();
    let isAiExtracted = false;

    // 1. Try Gemini AI extraction first
    let aiResult = await this.aiService.extractBookingIntent(prompt);

    if (aiResult) {
      isAiExtracted = true;
    } else {
      // 2. Fallback: Keyword extraction using simple heuristics
      this.logger.warn(
        `AI extraction unavailable or failed. Using fallback keyword matching for prompt: "${prompt}"`,
      );
      aiResult = this.createFallbackIntent(prompt);
    }

    // 3. Find matched Category in DB
    const matchedCategory = await this.findMatchingCategory(
      aiResult.categoryName,
      aiResult.keywords,
    );

    // 4. Find suggested Services in DB
    const suggestedServices = await this.findSuggestedServices(
      matchedCategory?.id,
      aiResult.keywords,
    );

    return {
      isAiExtracted,
      intent: aiResult,
      matchedCategory,
      suggestedServices,
    };
  }

  private createFallbackIntent(prompt: string): {
    categoryName: string;
    keywords: string[];
    summary: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  } {
    const words = prompt
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const isUrgent =
      /gấp|khẩn|ngay|chập|cháy|rò rỉ|nước tràn|cứu hộ/i.test(prompt);

    return {
      categoryName: words[0] || 'Chưa xác định',
      keywords: words.slice(0, 5),
      summary: prompt.length > 100 ? prompt.substring(0, 97) + '...' : prompt,
      urgency: isUrgent ? 'HIGH' : 'MEDIUM',
    };
  }

  private async findMatchingCategory(
    categoryName: string,
    keywords: string[],
  ): Promise<{ id: number; name: string } | null> {
    if (categoryName && categoryName !== 'Chưa xác định') {
      const category = await this.prisma.serviceCategory.findFirst({
        where: {
          isDeleted: false,
          name: { contains: categoryName, mode: 'insensitive' },
        },
        select: { id: true, name: true },
      });
      if (category) return category;
    }

    // Try matching category via keywords
    for (const keyword of keywords) {
      if (!keyword || keyword.length < 2) continue;
      const category = await this.prisma.serviceCategory.findFirst({
        where: {
          isDeleted: false,
          name: { contains: keyword, mode: 'insensitive' },
        },
        select: { id: true, name: true },
      });
      if (category) return category;
    }

    return null;
  }

  private async findSuggestedServices(
    categoryId?: number,
    keywords: string[] = [],
  ): Promise<SuggestedServiceItem[]> {
    const where: any = {
      status: 'ACTIVE',
      isDeleted: false,
      provider: {
        status: 'ACTIVE',
      },
    };

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (keywords.length > 0) {
      where.OR = keywords.map((word) => ({
        OR: [
          { name: { contains: word, mode: 'insensitive' } },
          { description: { contains: word, mode: 'insensitive' } },
        ],
      }));
    }

    const services = await this.prisma.service.findMany({
      where,
      take: 5,
      orderBy: { avgRating: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        referencePrice: true,
        avgRating: true,
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      referencePrice: s.referencePrice ? Number(s.referencePrice) : null,
      avgRating: Number(s.avgRating),
      category: s.category,
    }));
  }
}
