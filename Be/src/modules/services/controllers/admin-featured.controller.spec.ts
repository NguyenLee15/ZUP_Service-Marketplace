import { AdminFeaturedListingsController } from './admin-featured.controller';
import { FeaturedListingsService } from '../featured-listings.service';

describe('AdminFeaturedListingsController', () => {
  it('forwards the request IP when cancelling a listing', async () => {
    const cancelFeaturedListing = jest.fn().mockResolvedValue({
      data: { id: 1 },
    });
    const featuredListingsService = {
      adminCancelFeaturedListing: cancelFeaturedListing,
    } as unknown as FeaturedListingsService;
    const controller = new AdminFeaturedListingsController(
      featuredListingsService,
    );

    await controller.cancel(7, 1, '203.0.113.10');

    expect(cancelFeaturedListing).toHaveBeenCalledWith(7, 1, '203.0.113.10');
  });
});
