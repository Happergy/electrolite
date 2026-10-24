import { describe, expect, it } from 'vitest';
import { getPriceMarkerShape } from './priceMarker';

describe('getPriceMarkerShape', () => {
  it('uses a rotated cross for the best green price', () => {
    expect(getPriceMarkerShape('green', true)).toBe('crossRot');
  });

  it('uses a circle for other green prices', () => {
    expect(getPriceMarkerShape('green')).toBe('circle');
  });

  it('uses a triangle for yellow prices', () => {
    expect(getPriceMarkerShape('yellow')).toBe('triangle');
  });

  it('uses a rectangle for red prices', () => {
    expect(getPriceMarkerShape('red')).toBe('rect');
  });
});
