import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { UsersService } from './users.service';

type UsersPrismaMock = {
  user: {
    findUnique: jest.Mock;
  };
  userAddress: {
    findFirst: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  auditLog: {
    create: jest.Mock;
  };
};

describe('UsersService ownership', () => {
  let service: UsersService;
  let prisma: UsersPrismaMock;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, status: 'ACTIVE' }),
      },
      userAddress: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    service = new UsersService(
      prisma as unknown as PrismaService,
      {} as CloudinaryService,
      {} as any,
    );
  });

  it('rejects updating an address that does not belong to the user', async () => {
    await expect(
      service.updateAddress(1, 99, { label: 'Home' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.userAddress.findFirst).toHaveBeenCalledWith({
      where: { id: 99, userId: 1 },
    });
    expect(prisma.userAddress.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('rejects deleting an address that does not belong to the user', async () => {
    await expect(service.deleteAddress(1, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.userAddress.findFirst).toHaveBeenCalledWith({
      where: { id: 99, userId: 1 },
    });
    expect(prisma.userAddress.delete).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});
