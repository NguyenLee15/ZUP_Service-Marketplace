import { RedisService } from '../../shared/redis/redis.service';
import {
  createTrackingLocationStore,
  memoryTrackingLocationStore,
  TrackingLocationStore,
} from './tracking-location.store';

describe('TrackingLocationStore', () => {
  afterEach(() => {
    memoryTrackingLocationStore.clear();
  });

  it('shares memory locations between gateway and HTTP consumers when Redis is disabled', async () => {
    const redis = { isEnabled: jest.fn().mockReturnValue(false) };
    const gatewayStore = createTrackingLocationStore(
      redis as unknown as RedisService,
    );
    const httpStore = createTrackingLocationStore(
      redis as unknown as RedisService,
    );

    await gatewayStore.set(
      42,
      {
        lat: 21.0285,
        lng: 105.8542,
        heading: 90,
        speed: 25,
        updatedAt: '2030-01-01T10:00:00.000Z',
      },
      300,
    );

    await expect(httpStore.get(42)).resolves.toEqual({
      lat: 21.0285,
      lng: 105.8542,
      heading: 90,
      speed: 25,
      updatedAt: '2030-01-01T10:00:00.000Z',
    });
  });

  it('delegates Redis storage when Redis is enabled', async () => {
    const redis = {
      isEnabled: jest.fn().mockReturnValue(true),
      setJson: jest.fn().mockResolvedValue(undefined),
      getJson: jest.fn().mockResolvedValue({ lat: 1, lng: 2 }),
      del: jest.fn().mockResolvedValue(undefined),
    };
    const store: TrackingLocationStore = createTrackingLocationStore(
      redis as unknown as RedisService,
    );
    const location = { lat: 1, lng: 2, heading: 0, speed: 0, updatedAt: 'now' };

    await store.set(7, location, 300);
    await store.get(7);
    await store.delete(7);

    expect(redis.setJson).toHaveBeenCalledWith('tracking:7', location, 300);
    expect(redis.getJson).toHaveBeenCalledWith('tracking:7');
    expect(redis.del).toHaveBeenCalledWith('tracking:7');
  });
});
