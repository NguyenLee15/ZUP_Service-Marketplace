import { TrackingGateway } from './tracking.gateway';

describe('TrackingGateway location validation', () => {
  const createGateway = () => {
    const prisma = {
      booking: {
        findFirst: jest.fn().mockResolvedValue({ id: 42, customerId: 7 }),
      },
    };
    const store = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      delete: jest.fn(),
    };
    const server = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
    const gateway = new TrackingGateway(
      {} as never,
      prisma as never,
      { isEnabled: jest.fn().mockReturnValue(false) } as never,
    );
    const mutableGateway = gateway as any;
    mutableGateway.locationStore = store;
    mutableGateway.server = server;
    return {
      gateway: mutableGateway as TrackingGateway,
      prisma,
      store,
      server,
    };
  };

  it.each([
    ['NaN latitude', Number.NaN, 105.8],
    ['infinite longitude', 21, Number.POSITIVE_INFINITY],
    ['latitude below range', -90.001, 105.8],
    ['latitude above range', 90.001, 105.8],
    ['longitude below range', 21, -180.001],
    ['longitude above range', 21, 180.001],
  ])('rejects %s before persistence', async (_label, lat, lng) => {
    const { gateway, prisma, store, server } = createGateway();

    await gateway.handleUpdateLocation(
      { data: { user: { id: 9, role: 'PROVIDER' } } } as never,
      { bookingId: 42, lat, lng },
    );

    expect(prisma.booking.findFirst).not.toHaveBeenCalled();
    expect(store.set).not.toHaveBeenCalled();
    expect(server.emit).not.toHaveBeenCalled();
  });

  it.each([
    [-90, -180],
    [90, 180],
  ])('accepts GPS boundary %s/%s', async (lat, lng) => {
    const { gateway, store, server } = createGateway();

    await gateway.handleUpdateLocation(
      { data: { user: { id: 9, role: 'PROVIDER' } } } as never,
      { bookingId: 42, lat, lng },
    );

    expect(store.set).toHaveBeenCalledTimes(1);
    expect(server.emit).toHaveBeenCalledTimes(1);
  });
});
