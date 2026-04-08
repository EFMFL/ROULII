/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
  const prismaMock = {
    walletTransaction: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    booking: {
      aggregate: jest.fn(),
    },
  } as any;

  let service: WalletService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WalletService(prismaMock);
  });

  it('rejects withdrawals below the 10 EUR threshold', async () => {
    prismaMock.walletTransaction.aggregate.mockResolvedValue({
      _sum: { amount: 50 },
    });
    prismaMock.booking.aggregate.mockResolvedValue({
      _sum: { cashCommissionHeldAmount: 0 },
    });

    await expect(
      service.requestWithdrawal('user-id', { amount: 9.99 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects withdrawals above withdrawable balance', async () => {
    prismaMock.walletTransaction.aggregate.mockResolvedValue({
      _sum: { amount: 12 },
    });
    prismaMock.booking.aggregate.mockResolvedValue({
      _sum: { cashCommissionHeldAmount: 5 },
    });

    await expect(
      service.requestWithdrawal('user-id', { amount: 10 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
