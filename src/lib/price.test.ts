import { formatPrice, printPrice } from './price';

describe('formatPrice', () => {
  it('converts prices to euros per kWh rounded to cents', () => {
    expect(formatPrice(1_000_000)).toBe(10);
    expect(formatPrice(1_550_000)).toBe(15.5);
    expect(formatPrice(2_012_300)).toBe(20.12);
  });

  it('preserves the sign of negative prices', () => {
    expect(formatPrice(-1_000_000)).toBe(-10);
    expect(formatPrice(-1_550_000)).toBe(-15.5);
    expect(formatPrice(-2_012_300)).toBe(-20.12);
  });

  it('should handle zero price', () => {
    expect(formatPrice(0)).toBe(0);
  });
});

describe('printPrice', () => {
  it('should print formatted price', () => {
    expect(printPrice(10111)).toBe('0.10€');
  });

  it('prints negative prices instead of replacing them with zero', () => {
    expect(printPrice(-1314, true)).toBe('-0.01€ / kWh');
  });
});
