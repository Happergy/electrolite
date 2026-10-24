import { getCachedPriceData } from './priceCache';

export const PVPC_ADDITIONAL_FIELDS = ['PMHPCB', 'TAHPCB'] as const;

export type PVPCAdditionalField = (typeof PVPC_ADDITIONAL_FIELDS)[number];

export type PVPCPriceEntry = {
  PCB: string;
  Dia: string;
  Hora: string;
} & Partial<Record<PVPCAdditionalField, string>>;

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
