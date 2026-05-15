import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StorageProcessor } from './storage.processor';
import { CloudinaryModule } from '../../shared/cloudinary/cloudinary.module';
import {
  isRedisQueueEnabled,
  isWorkerEnabled,
} from '../../config/runtime.config';

@Module({
  imports: [
    CloudinaryModule,
    ...(isRedisQueueEnabled()
      ? [BullModule.registerQueue({ name: 'storage-queue' })]
      : []),
  ],
  providers: [...(isWorkerEnabled() ? [StorageProcessor] : [])],
})
export class StorageModule {}
