import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ErrorCodes } from '../../common/errors/error-codes';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'pdf'];

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
   * @param folder - Thư mục trên Cloudinary (vd: 'kyc', 'services', 'bookings')
   */
  async uploadFile(
    buffer: Buffer,
    folder: string,
  ): Promise<{ url: string; publicId: string }> {
    // Kiểm tra kích thước
    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Kích thước file không được vượt quá 5MB',
      });
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `service-marketplace/${folder}`,
            resource_type: 'auto', // Hỗ trợ cả ảnh và PDF
            allowed_formats: ALLOWED_FORMATS,
          },
          (error, result: UploadApiResponse | undefined) => {
            if (error) {
              this.logger.error('Cloudinary upload failed', error);
              reject(
                error instanceof Error
                  ? error
                  : new Error('Cloudinary upload failed'),
              );
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
