import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  CancelledBy,
  PaymentStatus,
  TripStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationsService,
  PushPayload,
} from '../notifications/notifications.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { MyBookingsQueryDto } from './dto/my-bookings-query.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(passengerId: string, createBookingDto: CreateBookingDto) {
    const seats = createBookingDto.seats ?? 1;

    const trip = await this.prismaService.trip.findUnique({
      where: { id: createBookingDto.tripId },
    });

    if (!trip) {
      throw new NotFoundException('Trajet introuvable');
    }

    if (trip.driverId === passengerId) {
      throw new BadRequestException(
        'Le conducteur ne peut pas réserver son propre trajet',
      );
    }

    if (trip.status !== TripStatus.ACTIVE) {
      throw new BadRequestException("Ce trajet n'est plus disponible");
    }

    if (trip.seatsAvailable < seats) {
      throw new BadRequestException(
        `Seulement ${trip.seatsAvailable} place(s) disponible(s)`,
      );
    }

    const booking = await this.prismaService.$transaction(async (tx) => {
      const updatedTrip = await tx.trip.update({
        where: { id: trip.id },
        data: { seatsAvailable: { decrement: seats } },
        select: { seatsAvailable: true },
      });

      if (updatedTrip.seatsAvailable < 0) {
        throw new BadRequestException('Plus de places disponibles');
      }

      const newBooking = await tx.booking.create({
        data: {
          tripId: trip.id,
          passengerId,
          status: BookingStatus.PENDING_PAYMENT,
        },
        include: {
          trip: {
            select: {
              id: true,
              origin: true,
              destination: true,
              departureTime: true,
              priceTotal: true,
              commissionAmount: true,
              driverAmount: true,
              driver: { select: { id: true, firstName: true, fcmToken: true } },
            },
          },
        },
      });

      await tx.payment.create({
        data: {
          bookingId: newBooking.id,
          amountTotal: trip.priceTotal,
          commissionAmount: trip.commissionAmount,
          driverAmount: trip.driverAmount,
          status: PaymentStatus.REQUIRES_PAYMENT_METHOD,
        },
      });

      return newBooking;
    });

    const driverFcmToken = booking.trip.driver.fcmToken;
    if (driverFcmToken) {
      const push: PushPayload = {
        title: 'Nouvelle réservation!',
        body: `${booking.trip.origin} → ${booking.trip.destination}`,
        data: { bookingId: booking.id, type: 'new_booking' },
      };
      void this.notificationsService.sendToToken(driverFcmToken, push);
    }

    return booking;
  }

  async findMine(passengerId: string, query: MyBookingsQueryDto) {
    const tab = query.tab ?? 'upcoming';
    const now = new Date();

    return this.prismaService.booking.findMany({
      where: {
        passengerId,
        trip: {
          departureTime: tab === 'upcoming' ? { gte: now } : { lt: now },
        },
      },
      include: {
        trip: {
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true,
            priceTotal: true,
            driver: {
              select: { id: true, firstName: true, photoUrl: true },
            },
          },
        },
        payment: { select: { status: true } },
      },
      orderBy: { trip: { departureTime: tab === 'upcoming' ? 'asc' : 'desc' } },
    });
  }

  async findOne(userId: string, bookingId: string) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: {
          include: {
            vehicle: true,
            driver: {
              select: {
                id: true,
                firstName: true,
                photoUrl: true,
                rating: true,
              },
            },
          },
        },
        passenger: { select: { id: true, firstName: true, photoUrl: true } },
        payment: true,
        cancellation: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    if (booking.passengerId !== userId && booking.trip.driverId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    return booking;
  }

  async cancelByPassenger(
    passengerId: string,
    bookingId: string,
    dto: CancelBookingDto,
  ) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: {
          select: {
            id: true,
            departureTime: true,
            driverId: true,
            driver: { select: { fcmToken: true, firstName: true } },
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    if (booking.passengerId !== passengerId) {
      throw new ForbiddenException('Accès refusé');
    }

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.REFUNDED
    ) {
      return { success: true };
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        "Impossible d'annuler une réservation terminée",
      );
    }

    const hoursUntilDeparture =
      (booking.trip.departureTime.getTime() - Date.now()) / (1000 * 60 * 60);

    const penaltyAmount =
      booking.status === BookingStatus.CONFIRMED && hoursUntilDeparture < 24
        ? Number(booking.payment?.amountTotal ?? 0) * 0.2
        : 0;

    await this.prismaService.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      await tx.cancellation.create({
        data: {
          bookingId,
          cancelledBy: CancelledBy.PASSENGER,
          reason: dto.reason,
          penaltyAmount,
        },
      });

      await tx.trip.update({
        where: { id: booking.trip.id },
        data: { seatsAvailable: { increment: 1 } },
      });

      if (booking.payment && booking.status === BookingStatus.CONFIRMED) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: PaymentStatus.REFUNDED },
        });
      }
    });

    const driverFcmToken = booking.trip.driver.fcmToken;
    if (driverFcmToken) {
      void this.notificationsService.sendToToken(driverFcmToken, {
        title: 'Réservation annulée',
        body: 'Un passager a annulé sa réservation',
        data: { bookingId, type: 'booking_cancelled' },
      });
    }

    return { success: true };
  }
}
