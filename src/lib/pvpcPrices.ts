import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/es';

import { normalizePriceDate } from './priceCache';
import {
  getCachedPVPC,
  PVPC_ADDITIONAL_FIELDS,
  type PVPCAdditionalField,
  type PVPCPriceEntry,
} from './pvpcCache';

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault('Europe/Madrid');

const MADRID_TZ = 'Europe/Madrid';
const INCOMPLETE_DATA_CACHE_TTL = 30 * 60 * 1000;

type PVPCPriceRecord = {
  date: string;
  price: number;
  simulated: boolean;
};

type PVPCResponse = {
  PVPC?: PVPCPriceEntry[];
};

const toInt = (value: string): number => Number.parseInt(value, 10);

const buildPVPCDate = (
  day: string,
  month: string,
  year: string,
  hour: string,
): string =>
  dayjs()
    .tz(MADRID_TZ)
    .date(toInt(day))
    .month(toInt(month) - 1)
    .year(toInt(year))
    .hour(getFirstHour(hour))
    .minute(0)
    .second(0)
    .toJSON();

export const formatPrice = (price?: string | number | null): number => {
  if (!price) {
    return 0;
  }

  const normalizedPrice =
    typeof price === 'number' ? `${price}` : price.replace(',', '.');
  return Math.trunc(Number.parseFloat(normalizedPrice) * 100);
};

export const formatPriceToSimulate = (price: number): number =>
  Number.parseFloat((price / 100000).toPrecision(4));

export const formatSimulatedPrice = (price: number): number =>
  Math.trunc(price * 100000);

export const getFirstHour = (hour: string): number => toInt(hour.split('-')[0]);

export const getExpectedPVPCHours = (date: string): number => {
  const start = dayjs.tz(date, MADRID_TZ).startOf('day');
  const nextDay = start.add(1, 'day').format('YYYY-MM-DD');

  return dayjs.tz(nextDay, MADRID_TZ).startOf('day').diff(start, 'hour');
};

export const isCompletePVPCDay = (
  date: string,
  prices: PVPCPriceEntry[],
): boolean => prices.length === getExpectedPVPCHours(date);

export const parsePriceDatePVPC = (
  prices: PVPCPriceEntry[],
): PVPCPriceRecord[] =>
  prices.map(({ PCB, Dia, Hora }) => {
    const [day, month, year] = Dia.split('/');

    return {
      date: buildPVPCDate(day, month, year, Hora),
      price: formatPrice(PCB),
      simulated: false,
    };
  });

export const getPVPC = async (date: string): Promise<PVPCPriceEntry[]> => {
  const normalizedDate = normalizePriceDate(date);

  return getCachedPVPC(
    normalizedDate,
    async () => {
      const fileName = `${normalizedDate.replace(/-/g, '')}-pvpc.json`;
      const response = await fetch(`prices/${fileName}`);

      if (response.status === 404 || response.status === 204) {
        return [];
      }
      if (!response.ok) {
        throw new Error(`Local PVPC price request failed: ${response.status}`);
      }

      const payload = (await response.json()) as PVPCResponse | null;
      if (!Array.isArray(payload?.PVPC)) {
        throw new Error(
          `Local PVPC file did not contain a price list: ${fileName}`,
        );
      }

      return payload.PVPC.filter(
        ({ PCB, Dia }) =>
          typeof PCB === 'string' &&
          Number.isFinite(Number.parseFloat(PCB.replace(',', '.'))) &&
          Dia === dayjs.tz(normalizedDate, MADRID_TZ).format('DD/MM/YYYY'),
      ).map(({ PCB, Dia, Hora, ...additionalData }) => {
        const entry: PVPCPriceEntry = { Dia, Hora, PCB };
        for (const field of PVPC_ADDITIONAL_FIELDS) {
          const value = additionalData[field as PVPCAdditionalField];
          if (typeof value === 'string') {
            entry[field] = value;
          }
        }

        return entry;
      });
    },
    (prices) =>
      isCompletePVPCDay(normalizedDate, prices)
        ? undefined
        : INCOMPLETE_DATA_CACHE_TTL,
  );
};
