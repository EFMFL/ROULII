import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationsService,
  PushPayload,
} from '../notifications/notifications.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async send(senderId: string, dto: SendMessageDto) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        trip: {
          select: {
            driverId: true,
            driver: { select: { fcmToken: true, firstName: true } },
          },
        },
        passenger: { select: { fcmToken: true, firstName: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    const isParticipant =
      booking.passengerId === senderId || booking.trip.driverId === senderId;

    if (!isParticipant) {
      throw new ForbiddenException('Accès refusé');
    }

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.REFUNDED
    ) {
      throw new ForbiddenException(
        'Messagerie désactivée pour cette réservation',
      );
    }

    const message = await this.prismaService.message.create({
      data: {
        bookingId: dto.bookingId,
        senderId,
        content: dto.content.trim(),
      },
      include: {
        sender: { select: { id: true, firstName: true, photoUrl: true } },
      },
    });

    const isDriver = booking.trip.driverId === senderId;
    const recipientFcmToken = isDriver
      ? booking.passenger.fcmToken
      : booking.trip.driver.fcmToken;

    const senderName = isDriver
      ? booking.trip.driver.firstName
      : booking.passenger.firstName;

    if (recipientFcmToken) {
      const push: PushPayload = {
        title: `Message de ${senderName ?? 'Roulii'}`,
        body:
          dto.content.length > 80
            ? dto.content.slice(0, 77) + '...'
            : dto.content,
        data: { bookingId: dto.bookingId, type: 'new_message' },
      };
      void this.notificationsService.sendToToken(recipientFcmToken, push);
    }

    return message;
  }

  async findByBooking(userId: string, bookingId: string) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: { trip: { select: { driverId: true } } },
    });

    if (!booking) {
      throw new NotFoundException('Réservation introuvable');
    }

    if (booking.passengerId !== userId && booking.trip.driverId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    return this.prismaService.message.findMany({
      where: { bookingId },
      include: {
        sender: { select: { id: true, firstName: true, photoUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
