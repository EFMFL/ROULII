import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(raterId: string, dto: CreateRatingDto) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        trip: { select: { id: true, driverId: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    if (booking.passengerId !== raterId && booking.trip.driverId !== raterId) {
      throw new ForbiddenException(
        'Vous ne participez pas à cette réservation',
      );
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Vous pouvez noter uniquement après la fin du trajet',
      );
    }

    const isRateeParticipant =
      dto.rateeId === booking.passengerId ||
      dto.rateeId === booking.trip.driverId;

    if (!isRateeParticipant) {
      throw new BadRequestException(
        'La personne notée doit être un participant de cette réservation',
      );
    }

    if (dto.rateeId === raterId) {
      throw new BadRequestException('Vous ne pouvez pas vous noter vous-même');
    }

    const existing = await this.prismaService.rating.findUnique({
      where: {
        raterId_rateeId_tripId: {
          raterId,
          rateeId: dto.rateeId,
          tripId: booking.trip.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Vous avez déjà noté cette personne pour ce trajet',
      );
    }

    const rating = await this.prismaService.$transaction(async (tx) => {
      const newRating = await tx.rating.create({
        data: {
          raterId,
          rateeId: dto.rateeId,
          tripId: booking.trip.id,
          score: dto.score,
          comment: dto.comment,
        },
      });

      const stats = await tx.rating.aggregate({
        where: { rateeId: dto.rateeId },
        _avg: { score: true },
      });

      const newAvg = stats._avg.score ?? dto.score;
      await tx.user.update({
        where: { id: dto.rateeId },
        data: { rating: newAvg },
      });

      return newRating;
    });

    return rating;
  }

  async findForUser(userId: string) {
    return this.prismaService.rating.findMany({
      where: { rateeId: userId },
      select: {
        id: true,
        score: true,
        comment: true,
        createdAt: true,
        rater: { select: { id: true, firstName: true, photoUrl: true } },
        trip: { select: { origin: true, destination: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
