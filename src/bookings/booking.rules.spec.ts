import {
  calculateLateCancellationPenalty,
  isLateCancellation,
  splitPenaltyAmount,
} from './booking.rules';

describe('booking rules', () => {
  it('should identify late cancellation inside 10-minute window', () => {
    expect(isLateCancellation(9.9)).toBe(true);
    expect(isLateCancellation(10)).toBe(false);
  });

  it('should compute 20% late cancellation penalty', () => {
    expect(calculateLateCancellationPenalty(54)).toBe(10.8);
    expect(calculateLateCancellationPenalty(72)).toBe(14.4);
  });

  it('should split penalty as 70/30', () => {
    expect(splitPenaltyAmount(10.8)).toEqual({
      platformShare: 7.56,
      driverWalletShare: 3.24,
    });
  });
});
