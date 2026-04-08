/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TrackingService } from './tracking.service';

describe('TrackingService fallback', () => {
  const prismaMock = {
    booking: {
      findUnique: jest.fn(),
    },
  } as any;

  const redisMock = {
    set: jest.fn(),
    get: jest.fn(),
  } as any;

  let service: TrackingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TrackingService(prismaMock, redisMock);
  });

  it('stores and reads position via memory fallback when Redis is unavailable', async () => {
    prismaMock.booking.findUnique
      .mockResolvedValueOnce({
        id: 'booking-id',
        trip: { driverId: 'driver-id' },
      })
      .mockResolvedValueOnce({
        id: 'booking-id',
        passengerId: 'passenger-id',
        trip: { driverId: 'driver-id' },
      });

    redisMock.set.mockRejectedValue(new Error('redis down'));
    redisMock.get.mockRejectedValue(new Error('redis down'));

    await service.updateDriverPosition('driver-id', 'booking-id', {
      latitude: 48.85,
      longitude: 2.35,
    });

    const result = await service.getBookingPosition(
      'passenger-id',
      'booking-id',
    );

    expect(result.available).toBe(true);
    expect(result.latitude).toBe(48.85);
    expect(result.longitude).toBe(2.35);
  });
});
