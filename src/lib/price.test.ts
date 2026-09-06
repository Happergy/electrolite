import { formatPrice, printPrice } from './price';

describe('formatPrice', () => {
  it('should format price with 2 decimal places', () => {
    expect(formatPrice(10)).toBe('10.00');
    expect(formatPrice(15.5)).toBe('15.50');
    expect(formatPrice(20.123)).toBe('20.12');
  });

  it('should handle negative prices', () => {
    expect(formatPrice(-10)).toBe('-10.00');
    expect(formatPrice(-15.5)).toBe('-15.50');
    expect(formatPrice(-20.123)).toBe('-20.12');
  });

  it('should handle zero price', () => {
    expect(formatPrice(0)).toBe('0.00');
  });
});

describe('printPrice', () => {
  it('should print formatted price', () => {
    expect(printPrice(10111)).toBe('0.10€');
  });
});
