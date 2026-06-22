import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../shared/ai/ai.service';
import { AnalyzeDisputePayload, JobName } from '../../shared/jobs/jobs.service';

@Processor('dispute_queue')
export class DisputeProcessor extends WorkerHost {
  private readonly logger = new Logger(DisputeProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<AnalyzeDisputePayload, void, JobName>): Promise<void> {
    const { disputeId, reason } = job.data;

    this.logger.log(`Processing dispute analysis for ID: ${disputeId}`);

    try {
      const analysis = await this.aiService.analyzeDispute(reason);

      if (analysis) {
        await this.prisma.dispute.update({
          where: { id: disputeId },
          data: { aiSummary: JSON.stringify(analysis) },
        });

        this.logger.log(`Successfully analyzed dispute ID: ${disputeId}`);
      } else {
        this.logger.warn(
          `AI analysis returned null for dispute ID: ${disputeId}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to analyze dispute ID ${disputeId}: ${message}`,
      );
      throw error;
    }
  }
}
