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

export const IMAGE_UPLOAD_LIMITS: MulterOptions = {
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: imageFileFilter,
};

export const AVATAR_UPLOAD_LIMITS: MulterOptions = {
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: imageFileFilter,
};
