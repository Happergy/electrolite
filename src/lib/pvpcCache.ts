import { getCachedPriceData } from './priceCache';

export type PVPCPriceEntry = {
  PCB: string;
  Dia: string;
  Hora: string;
};

const NEGATIVE_CACHE_TTL = 30 * 60 * 1000;

export const getCachedPVPC = (
  date: string,
  load: () => Promise<PVPCPriceEntry[]>,
  maxAge?: (data: PVPCPriceEntry[]) => number | undefined,
): Promise<PVPCPriceEntry[]> =>
  getCachedPriceData('pvpc', date, load, {
    negativeTTL: NEGATIVE_CACHE_TTL,
    maxAge,
  });
