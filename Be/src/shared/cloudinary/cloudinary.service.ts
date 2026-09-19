import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ErrorCodes } from '../../common/errors/error-codes';

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FORMATS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'pdf',
  'mp4',
  'mov',
  'webm',
];

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger('CloudinaryService');

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('cloudinary.cloudName'),
      api_key: this.configService.get<string>('cloudinary.apiKey'),
      api_secret: this.configService.get<string>('cloudinary.apiSecret'),
    });
  }

  /**
   * Upload file lên Cloudinary
   * @param buffer - File buffer
   * @param folder - Thư mục trên Cloudinary (vd: 'kyc', 'services', 'bookings', 'disputes')
   */
  async uploadFile(
    buffer: Buffer,
    folder: string,
    options?: { maxFileSize?: number; allowedFormats?: string[] },
  ): Promise<{ url: string; publicId: string }> {
    const maxSize = options?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
    const formats = options?.allowedFormats ?? ALLOWED_FORMATS;

    // Kiểm tra kích thước
    if (buffer.length > maxSize) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: `Kích thước file không được vượt quá ${Math.round(maxSize / (1024 * 1024))}MB`,
      });
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `service-marketplace/${folder}`,
            resource_type: 'auto', // Hỗ trợ cả ảnh, PDF và video
            allowed_formats: formats,
          },
          (error, result: UploadApiResponse | undefined) => {
            if (error) {
              this.logger.error('Cloudinary upload failed', error);
              reject(new Error('Cloudinary upload failed'));
              return;
            }
            if (!result) {
              reject(new Error('Upload failed: no result'));
              return;
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          },
        )
        .end(buffer);
    });
  }

  /** Xóa file trên Cloudinary */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.warn(`Failed to delete Cloudinary file: ${publicId}`, error);
    }
  }
}
