import { usePricesContext } from '../context/PricesContext';
import { formatPrice } from '../lib/price';

export enum COLORS {
  RED = 'red',
  YELLOW = 'yellow',
  GREEN = 'green',
}

const THRESHOLD = 0.025;
const DEFAULT_COLOR = COLORS.YELLOW;

export const useColors = (): {
  getColor: (price: number) => string;
  color: 'red' | 'yellow' | 'green';
} => {
  const { bestPrice: summaryBest, worstPrice: summaryWorst, avgPrice: summaryAvg, currentPrice } = usePricesContext();

  const getColor = (targetPrice: number) => {
    if (targetPrice === 0) {
      return COLORS.GREEN;
    }
    if (!targetPrice) {
      return DEFAULT_COLOR;
    }

    const bestPrice = formatPrice(summaryBest?.price);
    const worstPrice = formatPrice(summaryWorst?.price);
    const average = formatPrice(summaryAvg);
    const price = formatPrice(targetPrice);

    if (bestPrice + THRESHOLD >= price) {
      return COLORS.GREEN;
    }
    if (average + THRESHOLD >= price && average - THRESHOLD <= price) {
      return COLORS.YELLOW;
    }
    if (worstPrice - THRESHOLD <= price) {
      return COLORS.RED;
    }
    return COLORS.YELLOW;
  };

  return {
    getColor,
    color: getColor(currentPrice?.price),
  };
};
