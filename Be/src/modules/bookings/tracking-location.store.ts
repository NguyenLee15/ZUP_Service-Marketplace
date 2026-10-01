import { RedisService } from '../../shared/redis/redis.service';

export const TRACKING_LOCATION_KEY_PREFIX = 'tracking:';

export type TrackingLocation = {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  updatedAt: string;
};

export interface TrackingLocationStore {
  set(
    bookingId: number,
    location: TrackingLocation,
    ttlSeconds: number,
  ): Promise<void>;
  get(bookingId: number): Promise<TrackingLocation | null>;
  delete(bookingId: number): Promise<void>;
}

class MemoryTrackingLocationStore implements TrackingLocationStore {
  private readonly locations = new Map<
    number,
    { location: TrackingLocation; expiresAt: number }
  >();

  set(
    bookingId: number,
    location: TrackingLocation,
    ttlSeconds: number,
  ): Promise<void> {
    this.locations.set(bookingId, {
      location,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return Promise.resolve();
  }

  get(bookingId: number): Promise<TrackingLocation | null> {
    const entry = this.locations.get(bookingId);
    if (!entry) return Promise.resolve(null);
    if (entry.expiresAt <= Date.now()) {
      this.locations.delete(bookingId);
      return Promise.resolve(null);
    }
    return Promise.resolve(entry.location);
  }

  delete(bookingId: number): Promise<void> {
    this.locations.delete(bookingId);
    return Promise.resolve();
  }

  clear(): void {
    this.locations.clear();
  }
}

class RedisTrackingLocationStore implements TrackingLocationStore {
  constructor(private readonly redis: RedisService) {}

  set(
    bookingId: number,
    location: TrackingLocation,
    ttlSeconds: number,
  ): Promise<void> {
    return this.redis.setJson(
      `${TRACKING_LOCATION_KEY_PREFIX}${bookingId}`,
      location,
      ttlSeconds,
    );
  }

  get(bookingId: number): Promise<TrackingLocation | null> {
    return this.redis.getJson<TrackingLocation>(
      `${TRACKING_LOCATION_KEY_PREFIX}${bookingId}`,
    );
  }

  delete(bookingId: number): Promise<void> {
    return this.redis.del(`${TRACKING_LOCATION_KEY_PREFIX}${bookingId}`);
  }
}

export const memoryTrackingLocationStore = new MemoryTrackingLocationStore();

export function createTrackingLocationStore(
  redis: RedisService,
): TrackingLocationStore {
  return redis.isEnabled()
    ? new RedisTrackingLocationStore(redis)
    : memoryTrackingLocationStore;
}
