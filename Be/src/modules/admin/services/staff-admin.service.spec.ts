import { BadRequestException } from '@nestjs/common';
import { AdminPermission } from '../../../common/constants/admin-permissions';
import { PrismaService } from '../../../prisma/prisma.service';
import { StaffAdminService } from './staff-admin.service';

describe('StaffAdminService permissions', () => {
  let prisma: {
    user: {
      findUnique: jest.Mock;
    };
  };
  let service: StaffAdminService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    service = new StaffAdminService(prisma as unknown as PrismaService);
  });

  it('rejects unknown permissions when creating staff', async () => {
    await expect(
      service.createStaff(1, '127.0.0.1', {
        fullName: 'Staff',
        email: 'staff@test.local',
        password: 'Password123!',
        permissions: [AdminPermission.AUDIT_LOG_VIEW, 'unknown_permission'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects unknown permissions when updating staff', async () => {
    await expect(
      service.updateStaff(1, '127.0.0.1', 2, {
        permissions: ['invalid_permission'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
