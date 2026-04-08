import { JwtService } from '@nestjs/jwt';
import {
  BookingStatus,
  PaymentStatus,
  Prisma,
  PrismaClient,
  TripStatus,
  UserRole,
  WalletTransactionType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

const ids = {
  adminUserId: '11111111-1111-4111-8111-111111111111',
  driverUserId: '22222222-2222-4222-8222-222222222222',
  passengerUserId: '33333333-3333-4333-8333-333333333333',
  vehicleId: '44444444-4444-4444-8444-444444444444',
  activeTripId: '55555555-5555-4555-8555-555555555555',
  completedTripId: '66666666-6666-4666-8666-666666666666',
  pendingBookingId: '77777777-7777-4777-8777-777777777777',
  completedBookingId: '88888888-8888-4888-8888-888888888888',
  pendingPaymentId: '99999999-9999-4999-8999-999999999999',
  completedPaymentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  walletTransactionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  messageId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  ratingId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
} as const;

function loadDotEnv(): void {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function issueTokenPair(
  jwtService: JwtService,
  userId: string,
  role: UserRole,
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = { sub: userId, role };

  const accessToken = await jwtService.signAsync(payload, {
    secret: getRequiredEnv('JWT_ACCESS_SECRET'),
    expiresIn: 15 * 60,
  });

  const refreshToken = await jwtService.signAsync(payload, {
    secret: getRequiredEnv('JWT_REFRESH_SECRET'),
    expiresIn: 30 * 24 * 60 * 60,
  });

  return { accessToken, refreshToken };
}

async function main() {
  loadDotEnv();

  const jwtService = new JwtService();
  const futureDeparture = new Date('2026-08-20T15:30:00.000Z');
  const completedDeparture = new Date('2026-03-10T09:00:00.000Z');

  await prisma.user.upsert({
    where: { id: ids.adminUserId },
    update: {
      phone: '+33600000001',
      firstName: 'Admin Roulii',
      role: UserRole.ADMIN,
      isSuspended: false,
      deletedAt: null,
      rating: new Prisma.Decimal(5),
      reliabilityScore: 100,
    },
    create: {
      id: ids.adminUserId,
      phone: '+33600000001',
      firstName: 'Admin Roulii',
      role: UserRole.ADMIN,
      rating: new Prisma.Decimal(5),
      reliabilityScore: 100,
    },
  });

  await prisma.user.upsert({
    where: { id: ids.driverUserId },
    update: {
      phone: '+33600000002',
      firstName: 'Driver Demo',
      role: UserRole.USER,
      isSuspended: false,
      deletedAt: null,
      rating: new Prisma.Decimal(5),
      reliabilityScore: 96,
      fcmToken: 'driver-demo-fcm-token',
    },
    create: {
      id: ids.driverUserId,
      phone: '+33600000002',
      firstName: 'Driver Demo',
      role: UserRole.USER,
      rating: new Prisma.Decimal(5),
      reliabilityScore: 96,
      fcmToken: 'driver-demo-fcm-token',
    },
  });

  await prisma.user.upsert({
    where: { id: ids.passengerUserId },
    update: {
      phone: '+33600000003',
      firstName: 'Passenger Demo',
      role: UserRole.USER,
      isSuspended: false,
      deletedAt: null,
      rating: new Prisma.Decimal(5),
      reliabilityScore: 92,
      fcmToken: 'passenger-demo-fcm-token',
    },
    create: {
      id: ids.passengerUserId,
      phone: '+33600000003',
      firstName: 'Passenger Demo',
      role: UserRole.USER,
      rating: new Prisma.Decimal(5),
      reliabilityScore: 92,
      fcmToken: 'passenger-demo-fcm-token',
    },
  });

  const adminTokens = await issueTokenPair(
    jwtService,
    ids.adminUserId,
    UserRole.ADMIN,
  );
  const driverTokens = await issueTokenPair(
    jwtService,
    ids.driverUserId,
    UserRole.USER,
  );
  const passengerTokens = await issueTokenPair(
    jwtService,
    ids.passengerUserId,
    UserRole.USER,
  );

  await prisma.user.update({
    where: { id: ids.adminUserId },
    data: { refreshTokenHash: await bcrypt.hash(adminTokens.refreshToken, 10) },
  });
  await prisma.user.update({
    where: { id: ids.driverUserId },
    data: {
      refreshTokenHash: await bcrypt.hash(driverTokens.refreshToken, 10),
    },
  });
  await prisma.user.update({
    where: { id: ids.passengerUserId },
    data: {
      refreshTokenHash: await bcrypt.hash(passengerTokens.refreshToken, 10),
    },
  });

  await prisma.vehicle.upsert({
    where: { id: ids.vehicleId },
    update: {
      userId: ids.driverUserId,
      brand: 'Renault',
      model: 'Clio',
      color: 'Noir',
      plate: 'AA-123-BB',
    },
    create: {
      id: ids.vehicleId,
      userId: ids.driverUserId,
      brand: 'Renault',
      model: 'Clio',
      color: 'Noir',
      plate: 'AA-123-BB',
    },
  });

  await prisma.trip.upsert({
    where: { id: ids.activeTripId },
    update: {
      driverId: ids.driverUserId,
      vehicleId: ids.vehicleId,
      origin: '48.8566,2.3522',
      destination: '45.7640,4.8357',
      distanceKm: new Prisma.Decimal(465.38),
      departureTime: futureDeparture,
      seatsAvailable: 3,
      priceTotal: new Prisma.Decimal(279.23),
      commissionAmount: new Prisma.Decimal(67.28),
      driverAmount: new Prisma.Decimal(211.95),
      status: TripStatus.ACTIVE,
    },
    create: {
      id: ids.activeTripId,
      driverId: ids.driverUserId,
      vehicleId: ids.vehicleId,
      origin: '48.8566,2.3522',
      destination: '45.7640,4.8357',
      distanceKm: new Prisma.Decimal(465.38),
      departureTime: futureDeparture,
      seatsAvailable: 3,
      priceTotal: new Prisma.Decimal(279.23),
      commissionAmount: new Prisma.Decimal(67.28),
      driverAmount: new Prisma.Decimal(211.95),
      status: TripStatus.ACTIVE,
    },
  });

  await prisma.trip.upsert({
    where: { id: ids.completedTripId },
    update: {
      driverId: ids.driverUserId,
      vehicleId: ids.vehicleId,
      origin: 'Paris Gare de Lyon',
      destination: 'Lille Europe',
      distanceKm: new Prisma.Decimal(225.4),
      departureTime: completedDeparture,
      seatsAvailable: 2,
      priceTotal: new Prisma.Decimal(135.24),
      commissionAmount: new Prisma.Decimal(32.58),
      driverAmount: new Prisma.Decimal(102.66),
      status: TripStatus.COMPLETED,
    },
    create: {
      id: ids.completedTripId,
      driverId: ids.driverUserId,
      vehicleId: ids.vehicleId,
      origin: 'Paris Gare de Lyon',
      destination: 'Lille Europe',
      distanceKm: new Prisma.Decimal(225.4),
      departureTime: completedDeparture,
      seatsAvailable: 2,
      priceTotal: new Prisma.Decimal(135.24),
      commissionAmount: new Prisma.Decimal(32.58),
      driverAmount: new Prisma.Decimal(102.66),
      status: TripStatus.COMPLETED,
    },
  });

  await prisma.booking.upsert({
    where: { id: ids.pendingBookingId },
    update: {
      tripId: ids.activeTripId,
      passengerId: ids.passengerUserId,
      status: BookingStatus.PENDING_PAYMENT,
    },
    create: {
      id: ids.pendingBookingId,
      tripId: ids.activeTripId,
      passengerId: ids.passengerUserId,
      status: BookingStatus.PENDING_PAYMENT,
    },
  });

  await prisma.payment.upsert({
    where: { id: ids.pendingPaymentId },
    update: {
      bookingId: ids.pendingBookingId,
      amountTotal: new Prisma.Decimal(279.23),
      commissionAmount: new Prisma.Decimal(67.28),
      driverAmount: new Prisma.Decimal(211.95),
      status: PaymentStatus.REQUIRES_PAYMENT_METHOD,
      stripePaymentIntentId: null,
    },
    create: {
      id: ids.pendingPaymentId,
      bookingId: ids.pendingBookingId,
      amountTotal: new Prisma.Decimal(279.23),
      commissionAmount: new Prisma.Decimal(67.28),
      driverAmount: new Prisma.Decimal(211.95),
      status: PaymentStatus.REQUIRES_PAYMENT_METHOD,
    },
  });

  await prisma.booking.upsert({
    where: { id: ids.completedBookingId },
    update: {
      tripId: ids.completedTripId,
      passengerId: ids.passengerUserId,
      status: BookingStatus.COMPLETED,
    },
    create: {
      id: ids.completedBookingId,
      tripId: ids.completedTripId,
      passengerId: ids.passengerUserId,
      status: BookingStatus.COMPLETED,
    },
  });

  await prisma.payment.upsert({
    where: { id: ids.completedPaymentId },
    update: {
      bookingId: ids.completedBookingId,
      amountTotal: new Prisma.Decimal(135.24),
      commissionAmount: new Prisma.Decimal(32.58),
      driverAmount: new Prisma.Decimal(102.66),
      status: PaymentStatus.SUCCEEDED,
      stripePaymentIntentId: 'pi_seed_completed_trip',
    },
    create: {
      id: ids.completedPaymentId,
      bookingId: ids.completedBookingId,
      amountTotal: new Prisma.Decimal(135.24),
      commissionAmount: new Prisma.Decimal(32.58),
      driverAmount: new Prisma.Decimal(102.66),
      status: PaymentStatus.SUCCEEDED,
      stripePaymentIntentId: 'pi_seed_completed_trip',
    },
  });

  await prisma.walletTransaction.upsert({
    where: { id: ids.walletTransactionId },
    update: {
      userId: ids.driverUserId,
      type: WalletTransactionType.BOOKING_CREDIT,
      amount: new Prisma.Decimal(102.66),
      description: 'Crédit seed - trajet complété Paris → Lille',
    },
    create: {
      id: ids.walletTransactionId,
      userId: ids.driverUserId,
      type: WalletTransactionType.BOOKING_CREDIT,
      amount: new Prisma.Decimal(102.66),
      description: 'Crédit seed - trajet complété Paris → Lille',
    },
  });

  await prisma.message.upsert({
    where: { id: ids.messageId },
    update: {
      bookingId: ids.pendingBookingId,
      senderId: ids.passengerUserId,
      content: 'Bonjour, je serai devant la gare 10 minutes avant le départ.',
    },
    create: {
      id: ids.messageId,
      bookingId: ids.pendingBookingId,
      senderId: ids.passengerUserId,
      content: 'Bonjour, je serai devant la gare 10 minutes avant le départ.',
    },
  });

  await prisma.rating.upsert({
    where: { id: ids.ratingId },
    update: {
      raterId: ids.passengerUserId,
      rateeId: ids.driverUserId,
      tripId: ids.completedTripId,
      score: 5,
      comment: 'Conducteur ponctuel et très agréable.',
    },
    create: {
      id: ids.ratingId,
      raterId: ids.passengerUserId,
      rateeId: ids.driverUserId,
      tripId: ids.completedTripId,
      score: 5,
      comment: 'Conducteur ponctuel et très agréable.',
    },
  });

  await prisma.user.update({
    where: { id: ids.driverUserId },
    data: { rating: new Prisma.Decimal(5) },
  });

  const environment = {
    id: 'roulii-seed-env',
    name: 'Roulii Seeded Local Env',
    values: [
      { key: 'baseUrl', value: 'http://localhost:3000', enabled: true },
      {
        key: 'driverAccessToken',
        value: driverTokens.accessToken,
        enabled: true,
      },
      {
        key: 'driverRefreshToken',
        value: driverTokens.refreshToken,
        enabled: true,
      },
      {
        key: 'passengerAccessToken',
        value: passengerTokens.accessToken,
        enabled: true,
      },
      {
        key: 'passengerRefreshToken',
        value: passengerTokens.refreshToken,
        enabled: true,
      },
      {
        key: 'adminAccessToken',
        value: adminTokens.accessToken,
        enabled: true,
      },
      {
        key: 'adminRefreshToken',
        value: adminTokens.refreshToken,
        enabled: true,
      },
      { key: 'driverUserId', value: ids.driverUserId, enabled: true },
      { key: 'passengerUserId', value: ids.passengerUserId, enabled: true },
      { key: 'adminUserId', value: ids.adminUserId, enabled: true },
      { key: 'vehicleId', value: ids.vehicleId, enabled: true },
      { key: 'activeTripId', value: ids.activeTripId, enabled: true },
      { key: 'completedTripId', value: ids.completedTripId, enabled: true },
      { key: 'pendingBookingId', value: ids.pendingBookingId, enabled: true },
      {
        key: 'completedBookingId',
        value: ids.completedBookingId,
        enabled: true,
      },
    ],
    _postman_variable_scope: 'environment',
    _postman_exported_at: new Date().toISOString(),
    _postman_exported_using: 'GitHub Copilot',
  };

  writeFileSync(
    join(process.cwd(), 'postman', 'roulii-seed.postman_environment.json'),
    JSON.stringify(environment, null, 2),
  );

  console.log('Seed completed successfully.');
  console.log(JSON.stringify(environment.values, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
