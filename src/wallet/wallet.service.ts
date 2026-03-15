import { Injectable } from '@nestjs/common';
import { WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletQueryDto } from './dto/wallet-query.dto';

@Injectable()
export class WalletService {
  constructor(private readonly prismaService: PrismaService) {}

  async getBalance(
    userId: string,
  ): Promise<{ balance: number; currency: string }> {
    const aggregate = await this.prismaService.walletTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    const balance = Number(aggregate._sum.amount ?? 0);
    return { balance: Math.round(balance * 100) / 100, currency: 'EUR' };
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

  private isCreditType(type: WalletTransactionType): boolean {
    return (
      type === WalletTransactionType.BOOKING_CREDIT ||
      type === WalletTransactionType.ADJUSTMENT
    );
  }
}
