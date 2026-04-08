import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RechargeWalletDto } from './dto/recharge-wallet.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { WalletQueryDto } from './dto/wallet-query.dto';

@Injectable()
export class WalletService {
  private readonly minimumWithdrawalEur = 10;

  constructor(private readonly prismaService: PrismaService) {}

  async getBalance(userId: string): Promise<{
    balance: number;
    blockedAmount: number;
    withdrawableBalance: number;
    withdrawalThreshold: number;
    currency: string;
  }> {
    const aggregate = await this.prismaService.walletTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    const held = await this.prismaService.booking.aggregate({
      where: {
        trip: { driverId: userId },
        status: BookingStatus.CONFIRMED,
        cashCommissionHeld: true,
      },
      _sum: { cashCommissionHeldAmount: true },
    });

    const balance = this.round2(Number(aggregate._sum.amount ?? 0));
    const blockedAmount = this.round2(
      Number(held._sum.cashCommissionHeldAmount ?? 0),
    );
    const withdrawableBalance = this.round2(
      Math.max(balance - blockedAmount, 0),
    );

    return {
      balance,
      blockedAmount,
      withdrawableBalance,
      withdrawalThreshold: this.minimumWithdrawalEur,
      currency: 'EUR',
    };
  }

  async getTransactions(userId: string, query: WalletQueryDto) {
    const limit = Math.min(query.limit ?? 20, 50);

    const transactions = await this.prismaService.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasNextPage = transactions.length > limit;
    const items = hasNextPage ? transactions.slice(0, limit) : transactions;

    return {
      items: items.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        description: t.description,
        createdAt: t.createdAt,
        isCredit: this.isCreditType(t.type),
      })),
      nextCursor: hasNextPage ? items[items.length - 1]?.id : null,
    };
  }

  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto) {
    const current = await this.getBalance(userId);

    if (dto.amount < this.minimumWithdrawalEur) {
      throw new BadRequestException(
        `Le retrait minimum est de ${this.minimumWithdrawalEur.toFixed(2)} EUR`,
      );
    }

    if (current.withdrawableBalance < dto.amount) {
      throw new BadRequestException('Solde retirable insuffisant');
    }

    await this.prismaService.walletTransaction.create({
      data: {
        userId,
        type: WalletTransactionType.WITHDRAWAL,
        amount: -dto.amount,
        description: `Retrait bancaire de ${dto.amount.toFixed(2)} EUR`,
      },
    });

    return {
      success: true,
      amount: this.round2(dto.amount),
      balance: await this.getBalance(userId),
    };
  }

  async recharge(userId: string, dto: RechargeWalletDto) {
    await this.prismaService.walletTransaction.create({
      data: {
        userId,
        type: WalletTransactionType.ADJUSTMENT,
        amount: dto.amount,
        description:
          dto.reason ?? `Recharge wallet de ${dto.amount.toFixed(2)} EUR`,
      },
    });

    return {
      success: true,
      amount: this.round2(dto.amount),
      balance: await this.getBalance(userId),
    };
  }

  private isCreditType(type: WalletTransactionType): boolean {
    return (
      type === WalletTransactionType.BOOKING_CREDIT ||
      type === WalletTransactionType.PENALTY_RECEIVED ||
      type === WalletTransactionType.ADJUSTMENT
    );
  }

  private round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
