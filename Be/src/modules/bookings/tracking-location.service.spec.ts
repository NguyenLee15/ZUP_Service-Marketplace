import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { TrackingLocationService } from './tracking-location.service';
import { memoryTrackingLocationStore } from './tracking-location.store';

describe('TrackingLocationService', () => {
  afterEach(() => {
    memoryTrackingLocationStore.clear();
  });

  it('rejects a location request for a booking not owned by the customer', async () => {
    const prisma = {
      booking: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const redis = { isEnabled: jest.fn().mockReturnValue(true) };
    const service = new TrackingLocationService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );

    await expect(service.getForCustomer(42, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns the Redis last-known location for an owned trackable booking', async () => {
    const prisma = {
      booking: { findFirst: jest.fn().mockResolvedValue({ id: 42 }) },
    };
    const redis = {
      isEnabled: jest.fn().mockReturnValue(true),
      getJson: jest.fn().mockResolvedValue({
        lat: 21.0285,
        lng: 105.8542,
        heading: 90,
        speed: 25,
        updatedAt: '2030-01-01T10:00:00.000Z',
      }),
    };
    const service = new TrackingLocationService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );

    await expect(service.getForCustomer(42, 7)).resolves.toEqual({
      data: expect.objectContaining({ lat: 21.0285, lng: 105.8542 }),
    });
    expect(redis.getJson).toHaveBeenCalledWith('tracking:42');
  });

  it('returns the shared memory last-known location when Redis is disabled', async () => {
    const prisma = {
      booking: { findFirst: jest.fn().mockResolvedValue({ id: 42 }) },
    };
    const redis = { isEnabled: jest.fn().mockReturnValue(false) };
    await memoryTrackingLocationStore.set(42, {
      lat: 21.0285,
      lng: 105.8542,
      heading: 90,
      speed: 25,
      updatedAt: '2030-01-01T10:00:00.000Z',
    }, 300);
    const service = new TrackingLocationService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );

    await expect(service.getForCustomer(42, 7)).resolves.toEqual({
      data: expect.objectContaining({ lat: 21.0285, lng: 105.8542 }),
    });
  });
});
