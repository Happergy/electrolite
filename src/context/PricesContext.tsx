import { createContext, useContext } from 'react';
import { BestPriceWindow, PriceDetails } from '../types';

export type PricesContextValue = {
    prices: PriceDetails[];
    bestPrice: PriceDetails;
    worstPrice: PriceDetails;
    avgPrice: number;
    loading: boolean;
    error: Error | null;
    currentPrice: PriceDetails;
    bestPrices: Record<number, BestPriceWindow>;
    refreshPrices: () => void;
};

export const PricesContext = createContext<PricesContextValue | undefined>(undefined);

export const usePricesContext = (): PricesContextValue => {
    const context = useContext(PricesContext);

    if (!context) {
        throw new Error('usePricesContext must be used within PricesProvider');
    }

    return context;
};

export default PricesContext;