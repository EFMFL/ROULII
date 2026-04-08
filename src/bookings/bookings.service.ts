import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  CancelledBy,
  PaymentMethod,
  PaymentStatus,
  PlatformLedgerType,
  TripStatus,
  WalletTransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationsService,
  PushPayload,
} from '../notifications/notifications.service';
import {
  calculateLateCancellationPenalty,
  isLateCancellation,
  splitPenaltyAmount,
} from './booking.rules';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CompleteBookingDto } from './dto/complete-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { DriverBookingActionDto } from './dto/driver-booking-action.dto';
import { MyBookingsQueryDto } from './dto/my-bookings-query.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(passengerId: string, createBookingDto: CreateBookingDto) {
    const seats = createBookingDto.seats ?? 1;
    const paymentMethod = createBookingDto.paymentMethod ?? PaymentMethod.CARD;

    const trip = await this.prismaService.trip.findUnique({
      where: { id: createBookingDto.tripId },
      include: {
        driver: {
          select: { id: true, firstName: true, fcmToken: true },
        },
      },
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
          paymentMethod,
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
          status:
            paymentMethod === PaymentMethod.CARD
              ? PaymentStatus.REQUIRES_PAYMENT_METHOD
              : PaymentStatus.REQUIRES_CONFIRMATION,
        },
      });

      return newBooking;
    });

    const driverFcmToken = booking.trip.driver.fcmToken;
    if (driverFcmToken) {
      const push: PushPayload = {
        title:
          paymentMethod === PaymentMethod.CASH
            ? 'Nouvelle demande en espèces'
            : 'Nouvelle réservation!',
        body: `${booking.trip.origin} → ${booking.trip.destination}`,
        data: {
          bookingId: booking.id,
          type:
            paymentMethod === PaymentMethod.CASH
              ? 'new_cash_booking'
              : 'new_booking',
        },
      };
      void this.notificationsService.sendToToken(driverFcmToken, push);
    }

    return {
      ...booking,
      requiresDriverAcceptance: paymentMethod === PaymentMethod.CASH,
    };
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

  async driverAction(
    driverId: string,
    bookingId: string,
    dto: DriverBookingActionDto,
  ) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: {
          select: {
            id: true,
            origin: true,
            destination: true,
            driverId: true,
            commissionAmount: true,
          },
        },
        payment: true,
        passenger: { select: { id: true, fcmToken: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    if (booking.trip.driverId !== driverId) {
      throw new ForbiddenException('Accès refusé');
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Cette réservation ne peut plus être traitée',
      );
    }

    if (dto.action === 'reject') {
      await this.prismaService.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.CANCELLED },
        });

        await tx.cancellation.create({
          data: {
            bookingId: booking.id,
            cancelledBy: CancelledBy.DRIVER,
            reason: dto.reason,
            penaltyAmount: 0,
          },
        });

        await tx.trip.update({
          where: { id: booking.trip.id },
          data: { seatsAvailable: { increment: 1 } },
        });

        if (booking.payment) {
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: PaymentStatus.CANCELED },
          });
        }
      });

      if (booking.passenger.fcmToken) {
        void this.notificationsService.sendToToken(booking.passenger.fcmToken, {
          title: 'Réservation refusée',
          body: 'Le chauffeur a refusé votre demande de réservation',
          data: { bookingId: booking.id, type: 'booking_rejected' },
        });
      }

      return { success: true, action: 'rejected' as const };
    }

    if (booking.paymentMethod !== PaymentMethod.CASH) {
      throw new BadRequestException(
        'Acceptation chauffeur manuelle réservée aux paiements en espèces',
      );
    }

    const commissionAmount = Number(
      booking.payment?.commissionAmount ?? booking.trip.commissionAmount,
    );

    const withdrawableBalance =
      await this.getDriverWithdrawableBalance(driverId);

    if (withdrawableBalance < commissionAmount) {
      throw new BadRequestException(
        `Wallet insuffisant (${withdrawableBalance.toFixed(2)} EUR). Minimum requis: ${commissionAmount.toFixed(2)} EUR`,
      );
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CONFIRMED,
          cashCommissionHeld: true,
          cashCommissionHeldAmount: commissionAmount,
          cashAcceptedAt: new Date(),
        },
      });

      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: PaymentStatus.SUCCEEDED },
        });
      }
    });

    if (booking.passenger.fcmToken) {
      void this.notificationsService.sendToToken(booking.passenger.fcmToken, {
        title: 'Réservation confirmée',
        body: 'Le chauffeur a accepté votre réservation en espèces',
        data: { bookingId: booking.id, type: 'cash_booking_accepted' },
      });
    }

    return {
      success: true,
      action: 'accepted' as const,
      commissionHeldAmount: Math.round(commissionAmount * 100) / 100,
    };
  }

  async completeByDriver(
    driverId: string,
    bookingId: string,
    dto: CompleteBookingDto,
  ) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: {
          select: {
            id: true,
            origin: true,
            destination: true,
            driverId: true,
          },
        },
        payment: true,
        passenger: { select: { fcmToken: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    if (booking.trip.driverId !== driverId) {
      throw new ForbiddenException('Accès refusé');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Seules les réservations confirmées peuvent être terminées',
      );
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),
          cashCommissionHeld: false,
          cashCommissionHeldAmount: 0,
        },
      });

      if (booking.paymentMethod === PaymentMethod.CASH) {
        const holdAmount = Number(booking.cashCommissionHeldAmount ?? 0);

        if (holdAmount > 0) {
          await tx.walletTransaction.create({
            data: {
              userId: driverId,
              type: WalletTransactionType.COMMISSION_CAPTURE,
              amount: -holdAmount,
              description: `Commission espèces prélevée #${booking.id.slice(0, 8)}`,
            },
          });

          await tx.platformLedgerTransaction.create({
            data: {
              type: PlatformLedgerType.COMMISSION_SHARE,
              amount: holdAmount,
              bookingId: booking.id,
              description: `Commission espèces #${booking.id.slice(0, 8)} — ${booking.trip.origin} → ${booking.trip.destination}`,
            },
          });
        }
      }
    });

    if (booking.passenger.fcmToken) {
      void this.notificationsService.sendToToken(booking.passenger.fcmToken, {
        title: 'Trajet terminé',
        body: dto.note ?? 'Merci d’avoir voyagé avec Roulii',
        data: { bookingId: booking.id, type: 'booking_completed' },
      });
    }

    return { success: true };
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
            origin: true,
            destination: true,
            priceTotal: true,
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
    const minutesUntilDeparture = hoursUntilDeparture * 60;

    const penaltyAmount =
      booking.status === BookingStatus.CONFIRMED &&
      isLateCancellation(minutesUntilDeparture)
        ? calculateLateCancellationPenalty(
            Number(booking.payment?.amountTotal ?? booking.trip.priceTotal),
          )
        : 0;

    const { platformShare, driverWalletShare } =
      splitPenaltyAmount(penaltyAmount);

    await this.prismaService.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cashCommissionHeld: false,
          cashCommissionHeldAmount: 0,
        },
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

      if (penaltyAmount > 0) {
        await tx.walletTransaction.create({
          data: {
            userId: booking.trip.driverId,
            type: WalletTransactionType.PENALTY_RECEIVED,
            amount: driverWalletShare,
            description: `Part amende (30%) #${booking.id.slice(0, 8)}`,
          },
        });

        await tx.walletTransaction.create({
          data: {
            userId: passengerId,
            type: WalletTransactionType.PENALTY_PAID,
            amount: -penaltyAmount,
            description: `Amende annulation tardive #${booking.id.slice(0, 8)}`,
          },
        });

        await tx.platformLedgerTransaction.create({
          data: {
            type: PlatformLedgerType.PENALTY_SHARE,
            amount: platformShare,
            bookingId,
            description: `Part plateforme amende (70%) #${booking.id.slice(0, 8)}`,
          },
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

  private async getDriverWithdrawableBalance(
    driverId: string,
  ): Promise<number> {
    const [ledgerBalance, heldCommissions] = await Promise.all([
      this.prismaService.walletTransaction.aggregate({
        where: { userId: driverId },
        _sum: { amount: true },
      }),
      this.prismaService.booking.aggregate({
        where: {
          trip: { driverId },
          status: BookingStatus.CONFIRMED,
          cashCommissionHeld: true,
        },
        _sum: { cashCommissionHeldAmount: true },
      }),
    ]);

    const balance = Number(ledgerBalance._sum.amount ?? 0);
    const blocked = Number(heldCommissions._sum.cashCommissionHeldAmount ?? 0);

    return (
      Math.round((Math.max(balance - blocked, 0) + Number.EPSILON) * 100) / 100
    );
  }
}
