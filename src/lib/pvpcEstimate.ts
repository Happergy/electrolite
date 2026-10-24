import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { getOmie, type OmiePrice } from './omie';
import { formatPrice, getFirstHour, getPVPC, parsePriceDatePVPC } from './pvpcPrices';
import type { PVPCPriceEntry } from './pvpcCache';
import type { PriceDetails } from '../types';

dayjs.extend(utc);
dayjs.extend(timezone);

const MADRID_TZ = 'Europe/Madrid';
const DAILY_MARKET_WEIGHT = 0.45;

const getPriceHour = (price: OmiePrice): number => dayjs(price.date).tz(MADRID_TZ).hour();

export const estimatePVPCPrices = (
  previousPVPC: PVPCPriceEntry[],
  previousOMIE: OmiePrice[],
  nextOMIE: OmiePrice[],
): PriceDetails[] => {
  if (previousPVPC.length === 0 || previousPVPC.length !== previousOMIE.length || nextOMIE.length === 0) {
    throw new Error('Insufficient hourly PVPC and OMIE data to estimate tomorrow prices.');
  }

  const previousPricesByHour = new Map<number, Array<{ pvpcPrice: number; omiePrice: number }>>();

  previousPVPC.forEach((entry, index) => {
    const hour = getFirstHour(entry.Hora);
    if (getPriceHour(previousOMIE[index]) !== hour) {
      throw new Error(`PVPC and OMIE reference hours do not match at index ${index}.`);
    }

    const previousPrices = previousPricesByHour.get(hour) ?? [];
    previousPrices.push({
      pvpcPrice: formatPrice(entry.PCB),
      omiePrice: previousOMIE[index].price,
    });
    previousPricesByHour.set(hour, previousPrices);
  });

  const occurrencesByHour = new Map<number, number>();

  return nextOMIE.map((omiePrice) => {
    const hour = getPriceHour(omiePrice);
    const occurrence = occurrencesByHour.get(hour) ?? 0;
    const previousPrices = previousPricesByHour.get(hour);
    const previousPrice = previousPrices?.[Math.min(occurrence, (previousPrices?.length ?? 1) - 1)];

    if (!previousPrice) {
      throw new Error(`Missing previous-day PVPC reference for hour ${hour}.`);
    }

    occurrencesByHour.set(hour, occurrence + 1);

    return {
      date: omiePrice.date,
      price: Math.round(
        previousPrice.pvpcPrice + DAILY_MARKET_WEIGHT * (omiePrice.price - previousPrice.omiePrice),
      ),
      simulated: true,
    };
  });
};

export const getEstimatedPVPC = async (targetDate: string): Promise<PriceDetails[]> => {
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
