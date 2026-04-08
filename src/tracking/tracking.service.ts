import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UpdatePositionDto } from './dto/update-position.dto';

interface PositionPayload {
  latitude: number;
  longitude: number;
  updatedAt: string;
}

interface CachedPosition {
  payload: PositionPayload;
  expiresAt: number;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private readonly ttlSeconds = 60 * 60;
  private readonly memoryFallback = new Map<string, CachedPosition>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async updateDriverPosition(
    userId: string,
    bookingId: string,
    dto: UpdatePositionDto,
  ) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        trip: { select: { driverId: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    if (booking.trip.driverId !== userId) {
      throw new ForbiddenException(
        'Seul le chauffeur peut mettre à jour la position',
      );
    }

    const payload: PositionPayload = {
      latitude: dto.latitude,
      longitude: dto.longitude,
      updatedAt: new Date().toISOString(),
    };

    await this.storePosition(bookingId, payload);

    return { success: true, bookingId, ...payload };
  }

  async getBookingPosition(userId: string, bookingId: string) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        passengerId: true,
        trip: { select: { driverId: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    if (booking.passengerId !== userId && booking.trip.driverId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    const payload = await this.loadPosition(bookingId);

    if (!payload) {
      return {
        bookingId,
        available: false,
      };
    }

    return {
      bookingId,
      available: true,
      ...payload,
    };
  }

  private positionKey(bookingId: string): string {
    return `tracking:booking:${bookingId}:position`;
  }

  private async storePosition(
    bookingId: string,
    payload: PositionPayload,
  ): Promise<void> {
    const key = this.positionKey(bookingId);

    try {
      await this.redisService.set(
        key,
        JSON.stringify(payload),
        this.ttlSeconds,
      );
      this.memoryFallback.delete(key);
      return;
    } catch {
      this.logger.warn(
        'Redis indisponible pour tracking, fallback mémoire actif',
      );
    }

    this.memoryFallback.set(key, {
      payload,
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    });
  }

  private async loadPosition(
    bookingId: string,
  ): Promise<PositionPayload | null> {
    const key = this.positionKey(bookingId);

    try {
      const raw = await this.redisService.get(key);
      if (raw) {
        return JSON.parse(raw) as PositionPayload;
      }
    } catch {
      this.logger.warn(
        'Lecture Redis tracking indisponible, fallback mémoire actif',
      );
    }

    const cached = this.memoryFallback.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.memoryFallback.delete(key);
      return null;
    }

    return cached.payload;
  }
}
