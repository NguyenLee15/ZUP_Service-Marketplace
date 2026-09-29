import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

describe('CloudinaryService compensation', () => {
  let service: CloudinaryService;

  beforeEach(() => {
    service = new CloudinaryService({
      get: jest.fn(),
    } as unknown as ConfigService);
  });

  it('reports failed asset deletions while continuing cleanup', async () => {
    const deleteFile = jest
      .spyOn(service, 'deleteFile')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await service.cleanupFiles(['asset-1', 'asset-2']);

    expect(deleteFile).toHaveBeenCalledWith('asset-1');
    expect(deleteFile).toHaveBeenCalledWith('asset-2');
    expect(result).toEqual({ failedPublicIds: ['asset-2'] });
  });

  it('does not call Cloudinary for an empty cleanup set', async () => {
    const deleteFile = jest.spyOn(service, 'deleteFile');

    await expect(service.cleanupFiles([])).resolves.toEqual({
      failedPublicIds: [],
    });
    expect(deleteFile).not.toHaveBeenCalled();
  });
});
