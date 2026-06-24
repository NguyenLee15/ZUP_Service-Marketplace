import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { BookingDisputeService } from './src/modules/bookings/booking-dispute.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(BookingDisputeService);
  try {
    await service.resolveDispute(1, 4, { resolutionAction: 'COMPLETE', resolutionReason: 'Test' }, '127.0.0.1');
    console.log('Success COMPLETE');
  } catch (e) {
    console.error('Error COMPLETE:', e);
  }

  await app.close();
}
bootstrap();
