import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('storage-queue')
export class StorageProcessor extends WorkerHost {
  private readonly logger = new Logger(StorageProcessor.name);

  constructor(
    private cloudinaryService: CloudinaryService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'storage.cleanup-orphaned':
        return this.handleCleanupOrphaned();
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleCleanupOrphaned() {
    this.logger.log('Starting orphaned storage cleanup...');
    // Logic: Quét database và Cloudinary để tìm file thừa
    // Placeholder logic
    this.logger.log('Cleanup finished.');
  }
}
