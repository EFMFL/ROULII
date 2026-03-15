import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingStatus,
  PaymentStatus,
  WalletTransactionType,
} from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationsService,
  PushPayload,
} from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe?: Stripe;
  private readonly webhookSecret?: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    const secretKey = configService.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (secretKey) {
      this.stripe = new Stripe(secretKey, { apiVersion: '2026-02-25.clover' });
    } else {
      this.logger.warn(
        'Stripe non configuré (STRIPE_SECRET_KEY manquant) — mode simulation activé',
      );
    }
  }

  async createPaymentIntent(passengerId: string, bookingId: string) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, trip: { select: { driverId: true } } },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    if (booking.passengerId !== passengerId) {
      throw new ForbiddenException('Accès refusé');
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        "Cette réservation n'est plus en attente de paiement",
      );
    }

    if (!booking.payment) {
      throw new NotFoundException('Enregistrement de paiement introuvable');
    }

    if (!this.stripe) {
      const simulatedClientSecret = `pi_sim_${booking.id}_secret_mock`;
      return {
        clientSecret: simulatedClientSecret,
        amount: Number(booking.payment.amountTotal),
        currency: 'eur',
        mode: 'simulation',
      };
    }

    const amountCents = Math.round(Number(booking.payment.amountTotal) * 100);

    let paymentIntentId = booking.payment.stripePaymentIntentId;

    if (!paymentIntentId) {
      const intent = await this.stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'eur',
        metadata: { bookingId, passengerId },
        automatic_payment_methods: { enabled: true },
      });

      paymentIntentId = intent.id;

      await this.prismaService.payment.update({
        where: { id: booking.payment.id },
        data: {
          stripePaymentIntentId: intent.id,
          status: PaymentStatus.REQUIRES_CONFIRMATION,
        },
      });

      return {
        clientSecret: intent.client_secret,
        amount: Number(booking.payment.amountTotal),
        currency: 'eur',
      };
    }

    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      clientSecret: intent.client_secret,
      amount: Number(booking.payment.amountTotal),
      currency: 'eur',
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    if (!this.stripe || !this.webhookSecret) {
      this.logger.warn('Webhook Stripe reçu mais Stripe non configuré');
      return;
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Webhook signature invalide: ${msg}`);
      throw new BadRequestException('Signature webhook invalide');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      default:
        break;
    }
  }

  async getPaymentForBooking(userId: string, bookingId: string) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        trip: { select: { driverId: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    if (booking.passengerId !== userId && booking.trip.driverId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    return booking.payment;
  }

  private async handlePaymentSuccess(intent: Stripe.PaymentIntent) {
    const bookingId = intent.metadata?.bookingId;
    if (!bookingId) {
      return;
    }

    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        trip: {
          select: {
            id: true,
            driverAmount: true,
            origin: true,
            destination: true,
            driver: { select: { id: true, fcmToken: true } },
          },
        },
        passenger: { select: { fcmToken: true } },
      },
    });

    if (!booking || !booking.payment) {
      return;
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });

      await tx.payment.update({
        where: { id: booking.payment!.id },
        data: { status: PaymentStatus.SUCCEEDED },
      });

      await tx.walletTransaction.create({
        data: {
          userId: booking.trip.driver.id,
          type: WalletTransactionType.BOOKING_CREDIT,
          amount: booking.trip.driverAmount,
          description: `Réservation #${bookingId.slice(0, 8)} — ${booking.trip.origin} → ${booking.trip.destination}`,
        },
      });
    });

    const notifications: Array<Promise<void>> = [];

    if (booking.passenger.fcmToken) {
      const push: PushPayload = {
        title: 'Paiement confirmé!',
        body: `${booking.trip.origin} → ${booking.trip.destination}`,
        data: { bookingId, type: 'payment_confirmed' },
      };
      notifications.push(
        this.notificationsService.sendToToken(booking.passenger.fcmToken, push),
      );
    }

    if (booking.trip.driver.fcmToken) {
      const push: PushPayload = {
        title: 'Paiement reçu!',
        body: `Votre trajet ${booking.trip.origin} → ${booking.trip.destination} est confirmé`,
        data: { bookingId, type: 'booking_payment_received' },
      };
      notifications.push(
        this.notificationsService.sendToToken(
          booking.trip.driver.fcmToken,
          push,
        ),
      );
    }

    await Promise.allSettled(notifications);
  }

  private async handlePaymentFailed(intent: Stripe.PaymentIntent) {
    const bookingId = intent.metadata?.bookingId;
    if (!bookingId) {
      return;
    }

    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, passenger: { select: { fcmToken: true } } },
    });

    if (!booking || !booking.payment) {
      return;
    }

    await this.prismaService.payment.update({
      where: { id: booking.payment.id },
      data: { status: PaymentStatus.CANCELED },
    });

    if (booking.passenger.fcmToken) {
      void this.notificationsService.sendToToken(booking.passenger.fcmToken, {
        title: 'Paiement échoué',
        body: "Votre paiement n'a pas abouti. Veuillez réessayer.",
        data: { bookingId, type: 'payment_failed' },
      });
    }
  }
}
