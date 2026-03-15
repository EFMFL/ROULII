import { BadRequestException } from '@nestjs/common';

export const MIN_TRIP_DISTANCE_KM = 30;
export const MAX_TRIP_DISTANCE_KM = 180;

export function validateMvpDistance(distanceKm: number): void {
  if (distanceKm < MIN_TRIP_DISTANCE_KM || distanceKm > MAX_TRIP_DISTANCE_KM) {
    throw new BadRequestException(
      `La distance doit etre comprise entre ${MIN_TRIP_DISTANCE_KM} et ${MAX_TRIP_DISTANCE_KM} km`,
    );
  }
}

export function calculateTripPricing(distanceKm: number): {
  priceTotal: number;
  commissionAmount: number;
  driverAmount: number;
} {
  const priceTotal = round2(distanceKm * 0.6);
  const commissionAmount = round2(priceTotal * 0.240878);
  const driverAmount = round2(priceTotal - commissionAmount);

  return {
    priceTotal,
    commissionAmount,
    driverAmount,
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
