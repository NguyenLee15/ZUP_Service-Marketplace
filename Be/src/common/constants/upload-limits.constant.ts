import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

const imageFileFilter: MulterOptions['fileFilter'] = (
  _request,
  file,
  callback,
) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    return callback(
      new BadRequestException('Chỉ chấp nhận tệp hình ảnh JPEG, PNG hoặc WebP'),
      false,
    );
  }

  callback(null, true);
};

export function hasValidImageSignature(
  mimetype: string,
  buffer: Buffer,
): boolean {
  if (mimetype === 'image/jpeg') {
    return (
      buffer.length >= 3 &&
      buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    );
  }

  if (mimetype === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }

  if (mimetype === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  if (mimetype === 'image/gif') {
    const header = buffer.subarray(0, 6).toString('ascii');
    return header === 'GIF87a' || header === 'GIF89a';
  }

  return false;
}

export const IMAGE_UPLOAD_LIMITS: MulterOptions = {
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: imageFileFilter,
};

export const AVATAR_UPLOAD_LIMITS: MulterOptions = {
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: imageFileFilter,
};
