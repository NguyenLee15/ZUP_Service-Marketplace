import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../shared/ai/ai.service';

@Processor('dispute_queue')
export class DisputeProcessor extends WorkerHost {
  private readonly logger = new Logger(DisputeProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { disputeId, reason } = job.data;

    this.logger.log(`Processing dispute analysis for ID: ${disputeId}`);

    try {
      const analysis = await this.aiService.analyzeDispute(reason);

      if (analysis) {
        const aiSummaryText = `[AI Phân loại]
- Nhóm: ${analysis.category}
- Mức độ: ${analysis.severity}
- Tóm tắt: ${analysis.summary}`;

        await this.prisma.dispute.update({
          where: { id: disputeId },
          data: { aiSummary: aiSummaryText },
        });

        this.logger.log(`Successfully analyzed dispute ID: ${disputeId}`);
      } else {
        this.logger.warn(
          `AI analysis returned null for dispute ID: ${disputeId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to analyze dispute ID ${disputeId}: ${error.message}`,
      );
      throw error;
    }
  }
}
