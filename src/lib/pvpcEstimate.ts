import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import type { PriceDetails } from '../types';
import { getOmie, type OmiePrice } from './omie';
import type { PVPCPriceEntry } from './pvpcCache';
import { formatPrice, getFirstHour, getPVPC } from './pvpcPrices';

dayjs.extend(utc);
dayjs.extend(timezone);

const MADRID_TZ = 'Europe/Madrid';

const getDailyMarketWeight = (date: string): number => {
  const year = dayjs(date).tz(MADRID_TZ).year();

  if (year === 2024) {
    return 0.75;
  }
  if (year === 2025) {
    return 0.6;
  }

  return 0.45;
};

const getPriceHour = (price: OmiePrice): number =>
  dayjs(price.date).tz(MADRID_TZ).hour();

const getComponentPrice = (
  entry: PVPCPriceEntry,
  field: 'PMHPCB' | 'TAHPCB',
): number | null => {
  const value = entry[field];
  if (
    typeof value !== 'string' ||
    !Number.isFinite(Number.parseFloat(value.replace(',', '.')))
  ) {
    return null;
  }

  return formatPrice(value);
};

export const estimatePVPCPrices = (
  previousPVPC: PVPCPriceEntry[],
  previousOMIE: OmiePrice[],
  nextOMIE: OmiePrice[],
): PriceDetails[] => {
  if (
    previousPVPC.length === 0 ||
    previousPVPC.length !== previousOMIE.length ||
    nextOMIE.length === 0
  ) {
    throw new Error(
      'Insufficient hourly PVPC and OMIE data to estimate tomorrow prices.',
    );
  }

  const previousDailyAverage =
    previousOMIE.reduce((sum, price) => sum + price.price, 0) /
    previousOMIE.length;
  const nextDailyAverage =
    nextOMIE.reduce((sum, price) => sum + price.price, 0) / nextOMIE.length;
  const dailyMarketWeight = getDailyMarketWeight(nextOMIE[0].date);
  const forwardMarketWeight = 1 - dailyMarketWeight;
  // Assume the forward basket and non-market cost terms remain unchanged from the reference day.
  const previousPricesByHour = new Map<
    number,
    Array<{
      omiePrice: number;
      pmhPrice: number;
      tahPrice: number;
      otherCosts: number;
    }>
  >();

  previousPVPC.forEach((entry, index) => {
    const hour = getFirstHour(entry.Hora);
    if (getPriceHour(previousOMIE[index]) !== hour) {
      throw new Error(
        `PVPC and OMIE reference hours do not match at index ${index}.`,
      );
    }

    const previousPrices = previousPricesByHour.get(hour) ?? [];
    const previousPmh =
      getComponentPrice(entry, 'PMHPCB') ?? previousOMIE[index].price;
    const previousTah = getComponentPrice(entry, 'TAHPCB') ?? 0;
    previousPrices.push({
      omiePrice: previousOMIE[index].price,
      pmhPrice: previousPmh,
      tahPrice: previousTah,
      otherCosts: formatPrice(entry.PCB) - previousPmh - previousTah,
    });
    previousPricesByHour.set(hour, previousPrices);
  });

  const occurrencesByHour = new Map<number, number>();

  return nextOMIE.map((omiePrice) => {
    const hour = getPriceHour(omiePrice);
    const occurrence = occurrencesByHour.get(hour) ?? 0;
    const previousPrices = previousPricesByHour.get(hour);
    const previousPrice =
      previousPrices?.[Math.min(occurrence, (previousPrices?.length ?? 1) - 1)];

    if (!previousPrice) {
      throw new Error(`Missing previous-day PVPC reference for hour ${hour}.`);
    }

    occurrencesByHour.set(hour, occurrence + 1);

    return {
      date: omiePrice.date,
      price: Math.round(
        previousPrice.pmhPrice +
          (omiePrice.price - previousPrice.omiePrice) +
          previousPrice.tahPrice -
          forwardMarketWeight * (nextDailyAverage - previousDailyAverage) +
          previousPrice.otherCosts,
      ),
      simulated: true,
    };
  });
};

export const getEstimatedPVPC = async (
  targetDate: string,
): Promise<PriceDetails[]> => {
  const target = dayjs.tz(targetDate, MADRID_TZ);
  const previousDate = target.subtract(1, 'day').format('YYYY-MM-DD');
  const normalizedTargetDate = target.format('YYYY-MM-DD');
  const [previousPVPC, previousOMIE, nextOMIE] = await Promise.all([
    getPVPC(previousDate),
    getOmie(previousDate),
    getOmie(normalizedTargetDate),
  ]);

  return estimatePVPCPrices(previousPVPC, previousOMIE, nextOMIE);
};
