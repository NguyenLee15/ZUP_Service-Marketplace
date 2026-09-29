import { ServiceCommandService } from './service-command.service';

describe('ServiceCommandService storage consistency', () => {
  it('removes uploaded assets when service transaction fails', async () => {
    const cloudinary = {
      uploadFile: jest
        .fn()
        .mockResolvedValue({ url: 'url-1', publicId: 'public-1' }),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };
    const prisma = {
      serviceCategory: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, isDeleted: false }),
      },
      $transaction: jest
        .fn()
        .mockRejectedValue(new Error('database unavailable')),
    };
    const shared = { checkActiveUser: jest.fn().mockResolvedValue(undefined) };

    const service = new ServiceCommandService(
      prisma as never,
      cloudinary as never,
      shared as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.create(
        7,
        {
          categoryId: 1,
          name: 'Cleaning',
          description: 'Home cleaning',
          items: [],
        },
        [{ buffer: Buffer.from('file') } as Express.Multer.File],
      ),
    ).rejects.toThrow('database unavailable');

    expect(cloudinary.uploadFile).toHaveBeenCalledTimes(1);
    expect(cloudinary.deleteFile).toHaveBeenCalledWith('public-1');
  });
});
