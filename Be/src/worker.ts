import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  getQueueMode,
  getRuntimeProfile,
  isCronEnabled,
  isRedisEnabled,
  isWorkerEnabled,
} from './config/runtime.config';

async function bootstrapWorker() {
  const logger = new Logger('WorkerBootstrap');
  const app = await NestFactory.createApplicationContext(AppModule);

  logger.log(
    `Worker started: profile=${getRuntimeProfile()}, redisEnabled=${isRedisEnabled()}, queueMode=${getQueueMode()}, workerEnabled=${isWorkerEnabled()}, cronEnabled=${isCronEnabled()}`,
  );

  const keepAlive = setInterval(() => undefined, 60 * 60 * 1000);

  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, shutting down worker...`);
    clearInterval(keepAlive);
    await app.close();
    process.exit(0);
  };

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

void bootstrapWorker();
