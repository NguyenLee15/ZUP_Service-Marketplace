import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffAdminService {
  constructor(private prisma: PrismaService) {}

  async getStaffs(page: number = 1, limit: number = 20, keyword?: string) {
    const where: any = { role: { in: ['ADMIN', 'STAFF'] } };
    if (keyword) {
      where.OR = [
        { fullName: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          avatarUrl: true,
          createdAt: true,
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createStaff(body: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      throw new BadRequestException({
        code: 'DUPLICATE_EMAIL',
        message: 'Email đã tồn tại',
      });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    return this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          fullName: body.fullName,
          email: body.email,
          phone: body.phone,
          password: hashedPassword,
          role: 'STAFF',
          status: 'ACTIVE',
          emailVerified: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: 0,
          action: 'CREATE_STAFF',
          targetType: 'USER',
          targetId: u.id,
          description: `Tạo tài khoản nhân viên: ${u.email}`,
        },
      });

      return u;
    });
  }

  async updateStaff(
    id: number,
    body: { fullName?: string; phone?: string; status?: string },
  ) {
    const data: any = {};
    if (body.fullName) data.fullName = body.fullName;
    if (body.phone) data.phone = body.phone;
    if (body.status) data.status = body.status;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data });

      if (body.status === 'LOCKED') {
        await tx.refreshToken.updateMany({
          where: { userId: id, revoked: false },
          data: { revoked: true },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: 0,
          action: 'UPDATE_STAFF',
          targetType: 'USER',
          targetId: id,
          description: `Cập nhật thông tin nhân viên: ${JSON.stringify(body)}`,
        },
      });
    });
  }

  async deleteStaff(adminId: number, id: number, ip: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user)
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Nhân viên không tồn tại',
      });

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          email: `DELETED_${id}_${user.email}`,
          status: 'LOCKED',
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: id, revoked: false },
        data: { revoked: true },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'DELETE_STAFF',
          targetType: 'USER',
          targetId: id,
          description: 'Xóa tài khoản nhân viên (Soft delete)',
          ipAddress: ip,
        },
      });
    });
  }
}
