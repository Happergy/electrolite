export type PriceMarkerShape = 'crossRot' | 'circle' | 'triangle' | 'rect';

export const getPriceMarkerShape = (
  color: string,
  isBestPrice = false,
): PriceMarkerShape => {
  if (color === 'green' && isBestPrice) {
    return 'crossRot';
  }

  if (color === 'green') {
    return 'circle';
  }

  if (color === 'red') {
    return 'rect';
  }

  return 'triangle';
};
