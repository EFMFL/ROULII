import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma, TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminTripsQueryDto } from './dto/admin-trips-query.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prismaService: PrismaService) {}

  async listUsers(query: AdminUsersQueryDto) {
    const limit = Math.min(query.limit ?? 20, 100);

    const where: Prisma.UserWhereInput = {
      ...(query.search
        ? { phone: { contains: query.search.trim(), mode: 'insensitive' } }
        : {}),
      ...(query.suspended !== undefined
        ? { isSuspended: query.suspended }
        : {}),
      deletedAt: null,
    };

    const users = await this.prismaService.user.findMany({
      where,
      select: {
        id: true,
        phone: true,
        firstName: true,
        role: true,
        isSuspended: true,
        rating: true,
        reliabilityScore: true,
        createdAt: true,
        _count: {
          select: {
            drivenTrips: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasNextPage = users.length > limit;
    const items = hasNextPage ? users.slice(0, limit) : users;

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1]?.id : null,
    };
  }

  async suspendUser(userId: string): Promise<{ success: true }> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    await this.prismaService.user.update({
      where: { id: userId },
      data: { isSuspended: true },
    });

    return { success: true };
  }

  async unsuspendUser(userId: string): Promise<{ success: true }> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    await this.prismaService.user.update({
      where: { id: userId },
      data: { isSuspended: false },
    });

    return { success: true };
  }

  async listTrips(query: AdminTripsQueryDto) {
    const limit = Math.min(query.limit ?? 20, 100);

    const where: Prisma.TripWhereInput = {
      ...(query.status ? { status: TripStatus[query.status] } : {}),
    };

    const trips = await this.prismaService.trip.findMany({
      where,
      include: {
        driver: { select: { id: true, firstName: true, phone: true } },
        vehicle: { select: { brand: true, model: true, plate: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasNextPage = trips.length > limit;
    const items = hasNextPage ? trips.slice(0, limit) : trips;

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1]?.id : null,
    };
  }

  async getStats() {
    const [users, trips, bookings, pendingBookings] = await Promise.all([
      this.prismaService.user.count({ where: { deletedAt: null } }),
      this.prismaService.trip.count(),
      this.prismaService.booking.count(),
      this.prismaService.booking.count({
        where: { status: BookingStatus.PENDING_PAYMENT },
      }),
    ]);

    const revenue = await this.prismaService.payment.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { commissionAmount: true },
    });

    return {
      users,
      trips,
      bookings,
      pendingBookings,
      totalCommissionEur: Number(revenue._sum.commissionAmount ?? 0),
    };
  }
}
