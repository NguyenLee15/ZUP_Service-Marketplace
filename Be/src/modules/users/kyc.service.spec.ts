import { KycService } from './kyc.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

function file(name: string): Express.Multer.File {
  return {
    fieldname: name,
    originalname: name,
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 10,
    destination: '',
    filename: name,
    path: '',
    buffer: Buffer.from('image'),
    stream: undefined as never,
  };
}

describe('KycService upload compensation', () => {
  let service: KycService;
  let cloudinary: { uploadFile: jest.Mock; cleanupFiles: jest.Mock };
  let prisma: {
    kycProfile: { findFirst: jest.Mock; create: jest.Mock };
    auditLog: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    cloudinary = {
      uploadFile: jest.fn(),
      cleanupFiles: jest.fn().mockResolvedValue({ failedPublicIds: [] }),
    };
    prisma = {
      kycProfile: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) =>
        callback(prisma),
      ),
    };
    service = new KycService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryService,
      { emit: jest.fn() } as unknown as EventEmitter2,
    );
  });

  it('cleans completed KYC uploads when a later upload fails', async () => {
    cloudinary.uploadFile
      .mockResolvedValueOnce({
        url: 'https://cdn/front',
        publicId: 'kyc-front',
      })
      .mockRejectedValueOnce(new Error('upload failed'));

    await expect(
      service.submitKyc(7, {
        cccdFront: file('front.jpg'),
        cccdBack: file('back.jpg'),
        portrait: file('portrait.jpg'),
      }),
    ).rejects.toThrow('upload failed');

    expect(cloudinary.cleanupFiles).toHaveBeenCalledWith(['kyc-front']);
    expect(prisma.kycProfile.create).not.toHaveBeenCalled();
  });

  it('cleans all KYC uploads when database persistence fails', async () => {
    cloudinary.uploadFile.mockResolvedValueOnce({
      url: 'https://cdn/front',
      publicId: 'kyc-front',
    });
    cloudinary.uploadFile.mockResolvedValueOnce({
      url: 'https://cdn/back',
      publicId: 'kyc-back',
    });
    cloudinary.uploadFile.mockResolvedValueOnce({
      url: 'https://cdn/portrait',
      publicId: 'kyc-portrait',
    });
    prisma.kycProfile.create.mockRejectedValue(new Error('database failed'));

    await expect(
      service.submitKyc(7, {
        cccdFront: file('front.jpg'),
        cccdBack: file('back.jpg'),
        portrait: file('portrait.jpg'),
      }),
    ).rejects.toThrow('database failed');

    expect(cloudinary.cleanupFiles).toHaveBeenCalledWith([
      'kyc-front',
      'kyc-back',
      'kyc-portrait',
    ]);
  });

  it('returns a controlled error when KYC cleanup fails', async () => {
    cloudinary.uploadFile.mockResolvedValue({
      url: 'https://cdn/front',
      publicId: 'kyc-front',
    });
    cloudinary.cleanupFiles.mockResolvedValue({
      failedPublicIds: ['kyc-front'],
    });
    prisma.kycProfile.create.mockRejectedValue(new Error('database failed'));

    await expect(
      service.submitKyc(7, {
        cccdFront: file('front.jpg'),
        cccdBack: file('back.jpg'),
        portrait: file('portrait.jpg'),
      }),
    ).rejects.toMatchObject({
      response: { code: 'ASSET_COMPENSATION_FAILED' },
    });
  });
});
