export const LATE_CANCELLATION_WINDOW_MINUTES = 10;
export const LATE_CANCELLATION_RATE = 0.2;
export const PENALTY_PLATFORM_SHARE_RATE = 0.7;
export const PENALTY_DRIVER_WALLET_SHARE_RATE = 0.3;

export function isLateCancellation(minutesUntilDeparture: number): boolean {
  return minutesUntilDeparture < LATE_CANCELLATION_WINDOW_MINUTES;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLateCancellationPenalty(amountTotal: number): number {
  return round2(amountTotal * LATE_CANCELLATION_RATE);
}

export function splitPenaltyAmount(penaltyAmount: number): {
  platformShare: number;
  driverWalletShare: number;
} {
  const platformShare = round2(penaltyAmount * PENALTY_PLATFORM_SHARE_RATE);
  const driverWalletShare = round2(penaltyAmount - platformShare);

  return {
    platformShare,
    driverWalletShare,
  };
}
