import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private eventEmitter: EventEmitter2) {
    super();
  }

  async onModuleInit() {
    await this.$connect();

    // (this as any).$use(async (params: any, next: any) => {
    //   const result = await next(params);
    //   if (params.model === 'Notification') {
    //     if (params.action === 'create') {
    //       this.eventEmitter.emit('notification.created', {
    //         userId: result.userId,
    //         notification: result,
    //       });
    //     } else if (params.action === 'createMany') {
    //       const data = params.args.data;
    //       if (Array.isArray(data)) {
    //         data.forEach((notif: any) => {
    //           this.eventEmitter.emit('notification.created', {
    //             userId: notif.userId,
    //             notification: { ...notif, createdAt: new Date(), isRead: false },
    //           });
    //         });
    //       }
    //     }
    //   }
    //   return result;
    // });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
