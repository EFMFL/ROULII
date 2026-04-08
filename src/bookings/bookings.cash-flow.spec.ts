/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { BookingStatus, PaymentMethod } from '@prisma/client';
import { BookingsService } from './bookings.service';

describe('BookingsService cash flow', () => {
  const prismaMock = {
    booking: {
      findUnique: jest.fn(),
      aggregate: jest.fn(),
    },
    walletTransaction: {
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    payment: {
      update: jest.fn(),
    },
    platformLedgerTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  const notificationsMock = {
    sendToToken: jest.fn().mockResolvedValue(undefined),
  } as any;

  let service: BookingsService;

  beforeEach(() => {
    jest.clearAllMocks();

    prismaMock.$transaction.mockImplementation((fn: any) =>
      fn({
        booking: { update: jest.fn() },
        payment: { update: jest.fn() },
        walletTransaction: { create: prismaMock.walletTransaction.create },
        platformLedgerTransaction: {
          create: prismaMock.platformLedgerTransaction.create,
        },
        cancellation: { create: jest.fn() },
        trip: { update: jest.fn() },
      }),
    );

    service = new BookingsService(prismaMock, notificationsMock);
  });

  it('accepts a cash booking and holds commission', async () => {
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'booking-id',
      status: BookingStatus.PENDING_PAYMENT,
      paymentMethod: PaymentMethod.CASH,
      trip: {
        id: 'trip-id',
        driverId: 'driver-id',
        origin: 'Paris',
        destination: 'Lyon',
        commissionAmount: 12.34,
      },
      payment: { id: 'payment-id', commissionAmount: 12.34 },
      passenger: { id: 'passenger-id', fcmToken: null },
    });

    prismaMock.walletTransaction.aggregate.mockResolvedValue({
      _sum: { amount: 100 },
    });
    prismaMock.booking.aggregate.mockResolvedValue({
      _sum: { cashCommissionHeldAmount: 0 },
    });

    const result = await service.driverAction('driver-id', 'booking-id', {
      action: 'accept',
    });

    expect(result).toEqual({
      success: true,
      action: 'accepted',
      commissionHeldAmount: 12.34,
    });
  });

  it('captures held commission when a cash booking is completed', async () => {
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'booking-id',
      status: BookingStatus.CONFIRMED,
      paymentMethod: PaymentMethod.CASH,
      cashCommissionHeldAmount: 9.48,
      trip: {
        id: 'trip-id',
        driverId: 'driver-id',
        origin: 'Paris',
        destination: 'Lyon',
      },
      payment: { id: 'payment-id' },
      passenger: { fcmToken: null },
    });

    const result = await service.completeByDriver('driver-id', 'booking-id', {
      note: 'completed',
    });

    expect(result).toEqual({ success: true });
    expect(prismaMock.walletTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: -9.48,
        }),
      }),
    );
    expect(prismaMock.platformLedgerTransaction.create).toHaveBeenCalled();
  });
});
