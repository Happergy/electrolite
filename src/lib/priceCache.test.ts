/// <reference types="jest" />

import { getCachedPriceData, normalizePriceDate } from './priceCache';

describe('getCachedPriceData', () => {
  it('coalesces concurrent requests for the same source and date', async () => {
    const load = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      return [{ price: 123 }];
    });

    const [firstResult, secondResult] = await Promise.all([
      getCachedPriceData('omie', '2026-10-12', load, { negativeTTL: 1000 }),
      getCachedPriceData('omie', '2026-10-12', load, { negativeTTL: 1000 }),
    ]);

    expect(firstResult).toEqual([{ price: 123 }]);
    expect(secondResult).toEqual(firstResult);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not coalesce requests for different dates', async () => {
    const load = jest.fn(async () => [{ price: 123 }]);

    await Promise.all([
      getCachedPriceData('pvpc', '2026-10-12', load, { negativeTTL: 1000 }),
      getCachedPriceData('pvpc', '2026-10-13', load, { negativeTTL: 1000 }),
    ]);

    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe('normalizePriceDate', () => {
  it('normalizes compact and timestamp date keys to the Madrid day', () => {
    expect(normalizePriceDate('20261012')).toBe('2026-10-12');
    expect(normalizePriceDate('2026-10-11T22:30:00Z')).toBe('2026-10-12');
  });
});
