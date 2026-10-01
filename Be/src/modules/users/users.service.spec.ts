import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { UsersService } from './users.service';
import { BadRequestException } from '@nestjs/common';

type UsersPrismaMock = {
  user: {
    findUnique: jest.Mock;
    update: jest.Mock;
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
  let cloudinary: { uploadFile: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, status: 'ACTIVE' }),
        update: jest.fn(),
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

    cloudinary = { uploadFile: jest.fn() };

    service = new UsersService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryService,
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

  it('rejects a forged avatar before Cloudinary upload', async () => {
    const avatar = {
      originalname: 'avatar.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('not-an-image'),
    } as Express.Multer.File;

    await expect(service.updateProfile(1, {}, avatar)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(cloudinary.uploadFile).not.toHaveBeenCalled();
  });

  it('uploads a valid avatar and updates the profile', async () => {
    const avatar = {
      originalname: 'avatar.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    } as Express.Multer.File;
    cloudinary.uploadFile.mockResolvedValue({
      url: 'https://cdn/avatar.jpg',
      publicId: 'avatar-1',
    });
    prisma.user.findUnique.mockResolvedValue({ id: 1, status: 'ACTIVE' });
    prisma.user.update = jest.fn().mockResolvedValue({
      id: 1,
      avatarUrl: 'https://cdn/avatar.jpg',
    });

    const result = await service.updateProfile(1, {}, avatar);

    expect(cloudinary.uploadFile).toHaveBeenCalledWith(
      avatar.buffer,
      'avatars',
    );
    expect(result.data.avatarUrl).toBe('https://cdn/avatar.jpg');
  });
});
