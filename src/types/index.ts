export enum CATEGORY {
  AIR_CONDITIONER = 'AIR_CONDITIONER',
  CHARGER = 'CHARGER',
  COOKER = 'COOKER',
  DISHWASHER = 'DISHWASHER',
  INDUCTION = 'INDUCTION',
  IRON = 'IRON',
  LOGO = 'LOGO',
  OVEN = 'OVEN',
  THERMOMIX = 'THERMOMIX',
  WASHING = 'WASHING',
}

export type Summary = {
  avgPrice: number;
  bestPrice: PriceDetails;
  worstPrice: PriceDetails;
  currentPrice: PriceDetails;
};

export interface TariffDevices {
  devices: Device[];
  summary: Summary;
  nextPrices: PriceDetails[];
}

export type PriceDetails = {
  price: number;
  date: string;
  simulated?: boolean;
};

export type BestPriceWindow = {
  duration: number;
  prices: PriceDetails[];
  totalPrice: number;
  averagePrice: number;
  startTime: string;
  endTime: string;
};

export interface Generic {
  omie: TariffDevices;
  pvpc: TariffDevices;
  pvpcToday: Summary;
  pvpcTomorrow: Summary;
}

export interface Device {
  id: string | undefined;
  duration: number;
  category: string;
  consumptionKWh: number;
  name: string;
  rangeEnd?: number;
  rangeStart?: number;
  showStartTime: boolean;
  cheapestCost?: string;
  costSavings?: number;
  currentCost?: number;
  endTime?: string;
  isOutOfRange?: boolean;
  startTime?: string;
}

export enum TARIFF {
  PCB = 'pvpc',
  OMIE = 'omie',
}
