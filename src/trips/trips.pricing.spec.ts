import { BadRequestException } from '@nestjs/common';
import { calculateTripPricing, validateMvpDistance } from './trips.pricing';

describe('trips pricing', () => {
  it('should calculate pricing from distance', () => {
    const pricing = calculateTripPricing(120);

    expect(pricing.priceTotal).toBe(72);
    expect(pricing.commissionAmount).toBe(17.34);
    expect(pricing.driverAmount).toBe(54.66);
  });

  it('should accept distance inside MVP limits', () => {
    expect(() => validateMvpDistance(30)).not.toThrow();
    expect(() => validateMvpDistance(180)).not.toThrow();
  });

  it('should reject distance out of MVP limits', () => {
    expect(() => validateMvpDistance(29.99)).toThrow(BadRequestException);
    expect(() => validateMvpDistance(180.01)).toThrow(BadRequestException);
  });
});
