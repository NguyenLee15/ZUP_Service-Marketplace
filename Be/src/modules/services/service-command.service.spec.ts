import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { ServiceCommandService } from './service-command.service';
import { ServiceSharedService } from './service-shared.service';

type ServiceCommandPrismaMock = {
  service: {
    update: jest.Mock;
    findUnique: jest.Mock;
  };
  providerWallet: {
    findUnique: jest.Mock;
  };
  $transaction: jest.Mock;
};

type ServiceSharedMock = {
  checkActiveUser: jest.Mock;
  checkOwnership: jest.Mock;
  notifyAdmins: jest.Mock;
};

describe('ServiceCommandService ownership', () => {
  let service: ServiceCommandService;
  let prisma: ServiceCommandPrismaMock;
  let shared: ServiceSharedMock;

  beforeEach(() => {
    prisma = {
      service: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      providerWallet: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    shared = {
      checkActiveUser: jest.fn().mockResolvedValue({ id: 1 }),
      checkOwnership: jest
        .fn()
        .mockRejectedValue(new NotFoundException('Dịch vụ không tồn tại')),
      notifyAdmins: jest.fn(),
    };

    service = new ServiceCommandService(
      prisma as unknown as PrismaService,
      {} as CloudinaryService,
      shared as unknown as ServiceSharedService,
      {} as any,
      {} as any,
    );
  });

  it.each([
    ['update', () => service.update(1, 99, { name: 'Blocked' })],
    ['submit', () => service.submit(1, 99)],
    ['hide', () => service.hide(1, 99)],
    ['show', () => service.show(1, 99)],
    ['deleteByProvider', () => service.deleteByProvider(1, 99)],
  ])('rejects %s when provider does not own the service', async (_, action) => {
    await expect(action()).rejects.toBeInstanceOf(NotFoundException);

    expect(shared.checkOwnership).toHaveBeenCalledWith(99, 1);
    expect(prisma.service.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(shared.notifyAdmins).not.toHaveBeenCalled();
  });
});
