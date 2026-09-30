import { BadRequestException } from '@nestjs/common';
import { ChatsController } from './chats.controller';

describe('ChatsController upload validation', () => {
  it('rejects an image with a forged MIME type before Cloudinary', async () => {
    const cloudinary = { uploadFile: jest.fn() };
    const controller = new ChatsController({} as never, cloudinary as never);

    await expect(
      controller.uploadImage({
        mimetype: 'image/png',
        buffer: Buffer.from('not-a-png'),
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(cloudinary.uploadFile).not.toHaveBeenCalled();
  });
});
