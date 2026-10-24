import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { getCachedPriceData, normalizePriceDate } from './priceCache';

dayjs.extend(utc);
dayjs.extend(timezone);

const MADRID_TZ = 'Europe/Madrid';
const NOT_PUBLISHED_CACHE_TTL = 30 * 60 * 1000;

export type OmiePrice = {
  date: string;
  price: number;
};

const getExpectedHoursInDay = (date: string): number => {
  const start = dayjs.tz(date, MADRID_TZ).startOf('day');
  const nextDay = start.add(1, 'day').format('YYYY-MM-DD');

  return dayjs.tz(nextDay, MADRID_TZ).startOf('day').diff(start, 'hour');
};

export const getOmie = async (date: string | Date): Promise<OmiePrice[]> => {
  const requestedDate =
    typeof date === 'string'
      ? normalizePriceDate(date)
      : dayjs(date).tz(MADRID_TZ).format('YYYY-MM-DD');
  const reqDate = requestedDate.replace(/-/g, '');
  const prices = await getCachedPriceData(
    'omie',
    requestedDate,
    async () => {
      const fileName = `${reqDate}-omie.json`;
      const response = await fetch(`prices/${fileName}`);

      if (response.status === 404 || response.status === 204) {
        return [];
      }
      if (!response.ok) {
        throw new Error(`Local OMIE price request failed: ${response.status}`);
      }

      const dailyPrices: unknown = await response.json();
      if (!Array.isArray(dailyPrices)) {
        throw new Error(`Local OMIE file did not contain a price list: ${fileName}`);
      }

      const dayPrices = dailyPrices.filter(
        (item): item is OmiePrice =>
          typeof item === 'object' &&
          item !== null &&
          'date' in item &&
          typeof item.date === 'string' &&
          dayjs(item.date).isValid() &&
          dayjs(item.date).tz(MADRID_TZ).format('YYYY-MM-DD') === requestedDate &&
          'price' in item &&
          typeof item.price === 'number' &&
          Number.isFinite(item.price),
      );

      return dayPrices.length === getExpectedHoursInDay(requestedDate) ? dayPrices : [];
    },
    { negativeTTL: NOT_PUBLISHED_CACHE_TTL },
  );

  if (prices.length === 0) {
    throw new Error(`OMIE returned no hourly prices for ${reqDate}`);
  }

  return prices;
};
