import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ServiceStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ServicesService } from '../services/services.service';
import { ChatbotIntentService } from './chatbot-intent.service';
import type { ChatbotPageContext } from './chatbot.types';
import { calculateHaversineDistance } from '../../shared/utils/geo';

export const chatbotServiceCardInclude = {
  category: { select: { id: true, name: true } },
  provider: {
    select: { id: true, fullName: true, avatarUrl: true, status: true },
  },
  images: {
    select: { id: true, imageUrl: true },
    orderBy: { displayOrder: 'asc' as const },
    take: 1,
  },
} satisfies Prisma.ServiceInclude;

type ServiceWithRelations = Prisma.ServiceGetPayload<{
  include: typeof chatbotServiceCardInclude;
}>;

export type RetrievedChatbotService = ServiceWithRelations & {
  distanceKm?: number;
  providerAddress?: string;
};

@Injectable()
export class ChatbotRetrievalService {
  private readonly logger = new Logger(ChatbotRetrievalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly servicesService: ServicesService,
    private readonly intentService: ChatbotIntentService,
  ) {}

  async findRelevantServices(
    query: string,
    pageContext?: ChatbotPageContext,
    customerCoords?: { lat: number; lng: number },
  ): Promise<RetrievedChatbotService[]> {
    const results: ServiceWithRelations[] = [];
    const contextServiceId = this.intentService.parsePositiveInt(
      pageContext?.serviceId,
    );

    if (contextServiceId) {
      const service = await this.prisma.service.findFirst({
        where: {
          id: contextServiceId,
          status: ServiceStatus.ACTIVE,
          isDeleted: false,
          provider: { status: UserStatus.ACTIVE },
        },
        include: chatbotServiceCardInclude,
      });
      if (service) results.push(service);
    }

    if (query.trim()) {
      try {
        const aiResult = await this.servicesService.aiSearch(query);
        const ids = (aiResult.data || [])
          .map((item: { id?: number }) => Number(item.id))
          .filter((id: number) => Number.isInteger(id) && id > 0)
          .slice(0, 8);

        if (ids.length > 0) {
          const hydrated = await this.prisma.service.findMany({
            where: {
              id: { in: ids },
              status: ServiceStatus.ACTIVE,
              isDeleted: false,
              provider: { status: UserStatus.ACTIVE },
            },
            include: chatbotServiceCardInclude,
          });
          const order = new Map(ids.map((id, index) => [id, index]));
          results.push(
            ...hydrated.sort(
              (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
            ),
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Semantic service search failed: ${message}`);
      }

      if (results.length < 3) {
        const keywords = this.extractKeywords(query);
        const fallback = await this.prisma.service.findMany({
          where: {
            status: ServiceStatus.ACTIVE,
            isDeleted: false,
            provider: { status: UserStatus.ACTIVE },
            OR:
              keywords.length > 0
                ? keywords.map((keyword) => ({
                    OR: [
                      {
                        name: {
                          contains: keyword,
                          mode: Prisma.QueryMode.insensitive,
                        },
                      },
                      {
                        description: {
                          contains: keyword,
                          mode: Prisma.QueryMode.insensitive,
                        },
                      },
                      {
                        category: {
                          name: {
                            contains: keyword,
                            mode: Prisma.QueryMode.insensitive,
                          },
                        },
                      },
                    ],
                  }))
                : [
                    {
                      name: {
                        contains: query,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  ],
          },
          include: chatbotServiceCardInclude,
          orderBy: [{ avgRating: 'desc' }, { totalReviews: 'desc' }],
          take: 8,
        });
        results.push(...fallback);
      }
    }

    const unique = this.uniqueServices(results);
    const providerIds = [
      ...new Set(unique.map((service) => service.providerId)),
    ];
    const addresses = await this.prisma.userAddress.findMany({
      where: { userId: { in: providerIds } },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    });
    const addressMap = new Map<number, (typeof addresses)[number]>();
    for (const address of addresses) {
      if (!addressMap.has(address.userId))
        addressMap.set(address.userId, address);
    }

    const servicesWithGeo = unique.map((service) => {
      const geoService: RetrievedChatbotService = { ...service };
      const address = addressMap.get(service.providerId);
      if (address) {
        geoService.providerAddress = `${address.addressDetail}, ${address.ward}, ${address.district}, ${address.province}`;
        if (customerCoords && address.latitude && address.longitude) {
          geoService.distanceKm = calculateHaversineDistance(
            customerCoords.lat,
            customerCoords.lng,
            Number(address.latitude),
            Number(address.longitude),
          );
        }
      }
      return geoService;
    });

    if (customerCoords) {
      servicesWithGeo.sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.distanceKm !== undefined) return -1;
        if (b.distanceKm !== undefined) return 1;
        return 0;
      });
    }

    return servicesWithGeo.slice(0, 5);
  }

  private uniqueServices(services: ServiceWithRelations[]) {
    const seen = new Set<number>();
    return services.filter((service) => {
      if (seen.has(service.id)) return false;
      seen.add(service.id);
      return true;
    });
  }

  private extractKeywords(message: string) {
    return message
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length >= 2)
      .slice(0, 8);
  }
}
