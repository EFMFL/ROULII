import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CalculateTripDto } from './dto/calculate-trip.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { MyTripsQueryDto } from './dto/my-trips-query.dto';
import { SearchTripsDto } from './dto/search-trips.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { DistanceService } from './services/distance.service';
import { calculateTripPricing, validateMvpDistance } from './trips.pricing';

@Injectable()
export class TripsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly distanceService: DistanceService,
  ) {}

  async calculate(calculateTripDto: CalculateTripDto) {
    const result = await this.distanceService.calculateDistanceKm(
      calculateTripDto.origin,
      calculateTripDto.destination,
    );

    validateMvpDistance(result.distanceKm);
    const pricing = calculateTripPricing(result.distanceKm);

    return {
      distanceKm: result.distanceKm,
      priceTotal: pricing.priceTotal,
      commissionAmount: pricing.commissionAmount,
      driverAmount: pricing.driverAmount,
      source: result.source,
    };
  }

  async create(driverId: string, createTripDto: CreateTripDto) {
    const departureTime = this.parseDate(createTripDto.departureTime);

    const driver = await this.prismaService.user.findUnique({
      where: { id: driverId },
      select: { id: true, reliabilityScore: true, isSuspended: true },
    });

    if (!driver) {
      throw new NotFoundException('Conducteur introuvable');
    }

    if (driver.isSuspended) {
      throw new ForbiddenException('Compte suspendu');
    }

    const vehicle = await this.resolveVehicle(
      driverId,
      createTripDto.vehicleId,
    );
    await this.ensureNoDriverScheduleConflict(driverId, departureTime);

    const distanceResult = await this.distanceService.calculateDistanceKm(
      createTripDto.origin,
      createTripDto.destination,
    );

    validateMvpDistance(distanceResult.distanceKm);

    if (distanceResult.distanceKm > 100 && driver.reliabilityScore < 70) {
      throw new ForbiddenException(
        'Score de fiabilite insuffisant pour un trajet de plus de 100 km',
      );
    }

    const pricing = calculateTripPricing(distanceResult.distanceKm);

    return this.prismaService.trip.create({
      data: {
        driverId,
        vehicleId: vehicle.id,
        origin: createTripDto.origin.trim(),
        destination: createTripDto.destination.trim(),
        departureTime,
        seatsAvailable: createTripDto.seatsAvailable,
        distanceKm: new Prisma.Decimal(distanceResult.distanceKm),
        priceTotal: new Prisma.Decimal(pricing.priceTotal),
        commissionAmount: new Prisma.Decimal(pricing.commissionAmount),
        driverAmount: new Prisma.Decimal(pricing.driverAmount),
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            photoUrl: true,
            reliabilityScore: true,
          },
        },
        vehicle: true,
      },
    });
  }

  async search(searchTripsDto: SearchTripsDto) {
    const limit = Math.min(searchTripsDto.limit ?? 20, 20);
    const seatsNeeded = searchTripsDto.seats ?? 1;

    const where: Prisma.TripWhereInput = {
      status: TripStatus.ACTIVE,
      seatsAvailable: { gte: seatsNeeded },
      ...(searchTripsDto.origin
        ? {
            origin: {
              contains: searchTripsDto.origin.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
      ...(searchTripsDto.destination
        ? {
            destination: {
              contains: searchTripsDto.destination.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
      ...(searchTripsDto.date ? this.buildDateFilter(searchTripsDto.date) : {}),
    };

    const trips = await this.prismaService.trip.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            photoUrl: true,
            reliabilityScore: true,
          },
        },
      },
      orderBy: [
        { driver: { reliabilityScore: 'desc' } },
        { departureTime: 'asc' },
        { id: 'asc' },
      ],
      take: limit + 1,
      ...(searchTripsDto.cursor
        ? { cursor: { id: searchTripsDto.cursor }, skip: 1 }
        : {}),
    });

    const hasNextPage = trips.length > limit;
    const items = hasNextPage ? trips.slice(0, limit) : trips;

    return {
      items: items.map((trip) => ({
        id: trip.id,
        driver: {
          id: trip.driver.id,
          firstName: trip.driver.firstName,
          photoUrl: trip.driver.photoUrl,
          reliabilityScore: trip.driver.reliabilityScore,
        },
        departureTime: trip.departureTime,
        distanceKm: trip.distanceKm,
        priceTotal: trip.priceTotal,
        seatsAvailable: trip.seatsAvailable,
        status: trip.status,
      })),
      nextCursor: hasNextPage ? items[items.length - 1]?.id : null,
    };
  }

  async findOne(id: string) {
    const trip = await this.prismaService.trip.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            photoUrl: true,
            rating: true,
            reliabilityScore: true,
          },
        },
        vehicle: true,
        bookings: {
          select: {
            id: true,
            passengerId: true,
            status: true,
            bookedAt: true,
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException('Trajet introuvable');
    }

    return trip;
  }

  async findMyTrips(driverId: string, myTripsQueryDto: MyTripsQueryDto) {
    const tab = myTripsQueryDto.tab ?? 'upcoming';
    const now = new Date();

    return this.prismaService.trip.findMany({
      where: {
        driverId,
        ...(tab === 'upcoming'
          ? { departureTime: { gte: now } }
          : { departureTime: { lt: now } }),
      },
      orderBy: {
        departureTime: tab === 'upcoming' ? 'asc' : 'desc',
      },
      include: {
        vehicle: true,
      },
    });
  }

  async update(driverId: string, tripId: string, updateTripDto: UpdateTripDto) {
    if (
      !updateTripDto.departureTime &&
      updateTripDto.seatsAvailable === undefined
    ) {
      throw new BadRequestException('Aucune modification envoyee');
    }

    const trip = await this.prismaService.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: {
          select: { status: true },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException('Trajet introuvable');
    }

    if (trip.driverId !== driverId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos trajets');
    }

    const hasAnyBooking = trip.bookings.some(
      (booking) => booking.status !== BookingStatus.CANCELLED,
    );

    if (hasAnyBooking) {
      throw new BadRequestException(
        'Modification impossible: des reservations existent deja',
      );
    }

    const departureTime = updateTripDto.departureTime
      ? this.parseDate(updateTripDto.departureTime)
      : undefined;

    if (departureTime) {
      await this.ensureNoDriverScheduleConflict(
        driverId,
        departureTime,
        tripId,
      );
    }

    return this.prismaService.trip.update({
      where: { id: tripId },
      data: {
        departureTime,
        seatsAvailable: updateTripDto.seatsAvailable,
      },
    });
  }

  async remove(driverId: string, tripId: string): Promise<{ success: true }> {
    const trip = await this.prismaService.trip.findUnique({
      where: { id: tripId },
      select: { id: true, driverId: true, status: true },
    });

    if (!trip) {
      throw new NotFoundException('Trajet introuvable');
    }

    if (trip.driverId !== driverId) {
      throw new ForbiddenException('Vous ne pouvez annuler que vos trajets');
    }

    if (trip.status === TripStatus.CANCELLED) {
      return { success: true };
    }

    await this.prismaService.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.CANCELLED },
    });

    return { success: true };
  }

  private parseDate(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date de depart invalide');
    }

    if (date.getTime() <= Date.now()) {
      throw new BadRequestException(
        'La date de depart doit etre dans le futur',
      );
    }

    return date;
  }

  private async resolveVehicle(driverId: string, requestedVehicleId?: string) {
    if (requestedVehicleId) {
      const vehicle = await this.prismaService.vehicle.findUnique({
        where: { id: requestedVehicleId },
      });

      if (!vehicle || vehicle.userId !== driverId) {
        throw new BadRequestException(
          'Vehicule introuvable pour ce conducteur',
        );
      }

      return vehicle;
    }

    const vehicle = await this.prismaService.vehicle.findFirst({
      where: { userId: driverId },
      orderBy: { createdAt: 'asc' },
    });

    if (!vehicle) {
      throw new BadRequestException(
        'Aucun vehicule enregistre. Ajoutez un vehicule avant de creer un trajet',
      );
    }

    return vehicle;
  }

  private async ensureNoDriverScheduleConflict(
    driverId: string,
    departureTime: Date,
    excludingTripId?: string,
  ): Promise<void> {
    const windowStart = new Date(departureTime.getTime() - 3 * 60 * 60 * 1000);
    const windowEnd = new Date(departureTime.getTime() + 3 * 60 * 60 * 1000);

    const conflictingTrip = await this.prismaService.trip.findFirst({
      where: {
        driverId,
        status: TripStatus.ACTIVE,
        departureTime: {
          gte: windowStart,
          lte: windowEnd,
        },
        ...(excludingTripId ? { id: { not: excludingTripId } } : {}),
      },
      select: { id: true },
    });

    if (conflictingTrip) {
      throw new ConflictException(
        'Conflit horaire detecte pour ce conducteur (fenetre +/- 3h)',
      );
    }
  }

  private buildDateFilter(date: string): Prisma.TripWhereInput {
    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Date de recherche invalide (YYYY-MM-DD)');
    }

    const nextDay = new Date(parsedDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    return {
      departureTime: {
        gte: parsedDate,
        lt: nextDay,
      },
    };
  }
}
