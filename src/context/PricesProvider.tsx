import dayjs from 'dayjs';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { initializePriceCache } from '../lib/priceCache';
import { getEstimatedPVPC } from '../lib/pvpcEstimate';
import {
  getPVPC,
  isCompletePVPCDay,
  parsePriceDatePVPC,
} from '../lib/pvpcPrices';
import type { BestPriceWindow, PriceDetails } from '../types';
import PricesContext from './PricesContext';

export const PricesProvider = ({ children }: PropsWithChildren) => {
  const [prices, setPrices] = useState<PriceDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializePriceCache().catch((cacheError: unknown) => {
      console.warn('Unable to initialize the local price cache.', cacheError);
    });
  }, []);

  useEffect(() => {
    const now = dayjs();
    const nextHour = now.add(1, 'hour').startOf('hour');
    const refreshTimer = window.setTimeout(
      () => window.location.reload(),
      Math.max(nextHour.diff(now), 1),
    );

    return () => window.clearTimeout(refreshTimer);
  }, []);

  const nextPrices = prices;
  const avgPrice =
    nextPrices.reduce((sum, price) => sum + price.price, 0) /
    (nextPrices.length || 1);
  const validPrices = nextPrices.filter(({ price }) => Number.isFinite(price));
  const firstPrice = validPrices[0] || { price: 0, date: '' };
  const bestPrice = validPrices.reduce(
    (min, price) => (price.price < min.price ? price : min),
    firstPrice,
  );
  const worstPrice = validPrices.reduce(
    (max, price) => (price.price > max.price ? price : max),
    firstPrice,
  );
  const currentPrice = nextPrices[0] || { price: 0, date: '' };
  const bestPrices = [1, 2, 3, 4, 5, 6].reduce<Record<number, BestPriceWindow>>(
    (windows, duration) => {
      let bestWindow: PriceDetails[] = [];
      let bestTotal = Number.POSITIVE_INFINITY;

      for (let index = 0; index <= nextPrices.length - duration; index += 1) {
        const window = nextPrices.slice(index, index + duration);
        const total = window.reduce((sum, price) => sum + price.price, 0);

        if (total < bestTotal) {
          bestWindow = window;
          bestTotal = total;
        }
      }

      const totalPrice = bestWindow.reduce(
        (sum, price) => sum + price.price,
        0,
      );

      windows[duration] = {
        duration,
        prices: bestWindow,
        totalPrice,
        averagePrice: bestWindow.length ? totalPrice / bestWindow.length : 0,
        startTime: bestWindow[0]?.date || '',
        endTime: bestWindow.length
          ? dayjs(bestWindow[bestWindow.length - 1].date)
              .add(1, 'hour')
              .toISOString()
          : '',
      };

      return windows;
    },
    {},
  );

  useEffect(() => {
    const controller = new AbortController();

    const getPricesForDate = async (
      date: dayjs.Dayjs,
      requireComplete = false,
    ): Promise<PriceDetails[]> => {
      const dateKey = date.format('YYYY-MM-DD');
      const pvpcEntries = await getPVPC(dateKey);
      if (requireComplete && !isCompletePVPCDay(dateKey, pvpcEntries)) {
        return [];
      }

      return parsePriceDatePVPC(pvpcEntries);
    };

    const loadPrices = async () => {
      try {
        const today = dayjs();
        const todayPrices = await getPricesForDate(today);
        const remainingToday = todayPrices.slice(today.hour());
        let upcomingPrices = remainingToday;

        if (remainingToday.length < 24) {
          const tomorrow = today.add(1, 'day');
          const sourceErrors: Error[] = [];
          let tomorrowPrices: PriceDetails[] = [];

          try {
            tomorrowPrices = await getPricesForDate(tomorrow, true);
          } catch (requestError) {
            sourceErrors.push(
              requestError instanceof Error
                ? requestError
                : new Error('Unable to load tomorrow PVPC'),
            );
          }

          if (tomorrowPrices.length === 0) {
            try {
              tomorrowPrices = await getEstimatedPVPC(
                tomorrow.format('YYYY-MM-DD'),
              );
            } catch (requestError) {
              sourceErrors.push(
                requestError instanceof Error
                  ? requestError
                  : new Error('Unable to estimate tomorrow PVPC prices'),
              );
            }
          }

          if (tomorrowPrices.length === 0) {
            const reasons = sourceErrors
              .map(({ message }) => message)
              .join('; ');
            const error = new Error(
              `Unable to load or estimate tomorrow prices: ${reasons}`,
            );

            if (remainingToday.length === 0) {
              throw error;
            }

            console.warn(
              'Tomorrow prices are unavailable; showing the remaining prices for today.',
              error,
            );
          } else {
            upcomingPrices = [...remainingToday, ...tomorrowPrices];
          }
        }

        setPrices(upcomingPrices.map((price: PriceDetails) => ({ ...price })));
      } catch (requestError) {
        if (
          !(requestError instanceof Error) ||
          requestError.name !== 'AbortError'
        ) {
          setError(
            requestError instanceof Error
              ? requestError
              : new Error('Unable to load prices'),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadPrices();

    return () => controller.abort();
  }, []);

  return (
    <PricesContext.Provider
      value={{
        prices: nextPrices,
        chartPrices: prices,
        bestPrice,
        worstPrice,
        avgPrice,
        currentPrice,
        bestPrices,
        loading,
        error,
      }}
    >
      {children}
    </PricesContext.Provider>
  );
};
