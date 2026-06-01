import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginationMeta } from '../../../common/dto/pagination.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditLogsQueryDto } from '../dto/admin.dto';

type AuditLogWithActor = Prisma.AuditLogGetPayload<{
  include: {
    actor: {
      select: {
        id: true;
        email: true;
        fullName: true;
        role: true;
      };
    };
  };
}>;

const auditLogActorSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminAuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuditLogs(query: AdminAuditLogsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: auditLogActorSelect },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: paginationMeta(total, page, limit),
    };
  }

  async exportAuditLogsCsv(query: AdminAuditLogsQueryDto) {
    const rows = await this.prisma.auditLog.findMany({
      where: this.buildWhere(query),
      include: {
        actor: { select: auditLogActorSelect },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    return this.toCsv(rows);
  }

  private buildWhere(query: AdminAuditLogsQueryDto): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.actorId) where.actorId = query.actorId;
    if (query.action) where.action = { contains: query.action };
    if (query.targetType) where.targetType = { contains: query.targetType };
    if (query.targetId) where.targetId = query.targetId;

    const createdAt = this.buildDateFilter(query.from, query.to);
    if (createdAt) where.createdAt = createdAt;

    const keyword = query.keyword?.trim();
    if (keyword) {
      where.OR = [
        { action: { contains: keyword, mode: 'insensitive' } },
        { targetType: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        {
          actor: {
            is: {
              OR: [
                { email: { contains: keyword, mode: 'insensitive' } },
                { fullName: { contains: keyword, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    return where;
  }

  private buildDateFilter(
    from: string | undefined,
    to: string | undefined,
  ): Prisma.DateTimeFilter | undefined {
    const gte = this.parseDate(from, 'from');
    const lte = this.parseDate(to, 'to');
    if (!gte && !lte) return undefined;
    return {
      ...(gte ? { gte } : {}),
      ...(lte ? { lte } : {}),
    };
  }

  private parseDate(value: string | undefined, edge: 'from' | 'to') {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    if (edge === 'to' && value.length <= 10) {
      date.setHours(23, 59, 59, 999);
    }
    return date;
  }

  private toCsv(rows: AuditLogWithActor[]) {
    const header = [
      'id',
      'createdAt',
      'actorEmail',
      'actorName',
      'actorRole',
      'action',
      'targetType',
      'targetId',
      'ipAddress',
      'description',
    ];
    const body = rows.map((row) =>
      [
        row.id,
        row.createdAt.toISOString(),
        row.actor.email,
        row.actor.fullName,
        row.actor.role,
        row.action,
        row.targetType,
        row.targetId,
        row.ipAddress ?? '',
        row.description ?? '',
      ]
        .map((value) => this.escapeCsvValue(value))
        .join(','),
    );

    return [header.join(','), ...body].join('\n');
  }

  private escapeCsvValue(value: string | number) {
    const text = String(value);
    if (!/[",\n\r]/.test(text)) return text;
    return `"${text.replace(/"/g, '""')}"`;
  }
}
