import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../shared/ai/ai.service';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SenderType } from '@prisma/client';

@Processor('ai-queue')
export class ServicesProcessor extends WorkerHost {
  private readonly logger = new Logger(ServicesProcessor.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'service.generate-embedding':
        return this.handleGenerateEmbedding(
          job.data.serviceId,
          job.data.name,
          job.data.description,
        );
      case 'service.auto-hide-violating':
        return this.handleAutoHideViolating();
      case 'chat.ai-reply':
        return this.handleAiChatReply(job.data);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleGenerateEmbedding(
    serviceId: number,
    name: string,
    description: string,
  ) {
    this.logger.log(`Generating embedding for service #${serviceId}`);
    const text = `${name} ${description}`;
    const embedding = await this.aiService.createEmbedding(text);

    if (embedding) {
      const vectorStr = `[${embedding.join(',')}]`;
      await this.prisma.$executeRawUnsafe(
        `UPDATE services SET embedding = '${vectorStr}'::vector WHERE id = ${serviceId}`,
      );
    }
  }

  private async handleAutoHideViolating() {
    this.logger.log('Checking for violating services (avgRating < 2.0)');
    await this.prisma.service.updateMany({
      where: { status: 'ACTIVE', avgRating: { lt: 2.0, gt: 0 } },
      data: { status: 'HIDDEN' },
    });
  }

  private async handleAiChatReply(data: {
    conversationId: number;
    customerId: number;
    providerId: number;
    lastMessage: string;
  }) {
    this.logger.log(
      `Generating AI reply for conversation #${data.conversationId}`,
    );

    // 1. Lấy context dịch vụ liên quan (tương tự ChatbotService)
    const services = await this.prisma.service.findMany({
      where: {
        providerId: data.providerId,
        status: 'ACTIVE',
        isDeleted: false,
      },
      take: 3,
    });

    const context =
      services.length > 0
        ? `Đây là các dịch vụ của nhà cung cấp này: ${services.map((s) => `${s.name} (${s.referencePrice} VNĐ)`).join(', ')}`
        : 'Nhà cung cấp này hiện chưa có thông tin dịch vụ cụ thể.';

    // 2. Lấy lịch sử chat ngắn
    const history = await this.prisma.message.findMany({
      where: { conversationId: data.conversationId },
      orderBy: { id: 'desc' },
      take: 5,
    });

    // 3. Gọi AI
    const aiResponse = await this.aiService.chat(
      data.lastMessage,
      context,
      history.reverse().map((m) => ({
        role: m.senderType === SenderType.AI ? 'assistant' : 'user',
        content: m.content,
      })),
    );

    // 4. Lưu tin nhắn vào DB
    const message = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: null, // AI
        senderType: SenderType.AI,
        content: aiResponse,
      },
      include: { conversation: true },
    });

    // 5. Emit event để Gateway gửi qua Socket
    this.eventEmitter.emit('ai.message.created', message);

    this.logger.log(`AI reply sent for conversation #${data.conversationId}`);
  }
}
