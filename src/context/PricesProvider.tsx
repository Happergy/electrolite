import { useEffect, useState, type PropsWithChildren } from 'react';
import dayjs from 'dayjs';
import PricesContext from './PricesContext';
import { BestPriceWindow, PriceDetails } from '../types';

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/Happergy/happergy-prices/main/data';

export const PricesProvider = ({ children }: PropsWithChildren) => {
    const [prices, setPrices] = useState<PriceDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const now = dayjs();
        const nextHour = now.add(1, 'hour').startOf('hour');
        const refreshTimer = window.setTimeout(() => window.location.reload(), Math.max(nextHour.diff(now), 1));

        return () => window.clearTimeout(refreshTimer);
    }, []);

    const nextPrices = prices.slice(0, 24);
    const avgPrice = nextPrices.reduce((sum, price) => sum + price.price, 0) / (nextPrices.length || 1);
    const validPrices = nextPrices.filter(({ price }) => price >= 0);
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

            const totalPrice = bestWindow.reduce((sum, price) => sum + price.price, 0);

            windows[duration] = {
                duration,
                prices: bestWindow,
                totalPrice,
                averagePrice: bestWindow.length ? totalPrice / bestWindow.length : 0,
                startTime: bestWindow[0]?.date || '',
                endTime: bestWindow.length
                    ? dayjs(bestWindow[bestWindow.length - 1].date).add(1, 'hour').toISOString()
                    : '',
            };

            return windows;
        },
        {},
    );

    const refreshPrices = () => {
        setLoading(true);
        setError(null);
        setRefreshKey((key) => key + 1);
    };

    useEffect(() => {
        const controller = new AbortController();

        const getPricesForDate = async (date: dayjs.Dayjs) => {
            const fileName = `${date.format('YYYYMMDD')}-pvpc.json`;
            const rawResponse = await fetch(`${GITHUB_RAW_URL}/${fileName}`, {
                signal: controller.signal,
            });

            if (!rawResponse.ok) {
                throw new Error(`Price file request failed: ${rawResponse.status}`);
            }

            return rawResponse.json();
        };

        const loadPrices = async () => {
            try {
                const today = dayjs();
                const todayPrices = await getPricesForDate(today);
                const remainingToday = todayPrices.slice(today.hour());
                let upcomingPrices = remainingToday;

                if (remainingToday.length < 24) {
                    try {
                        const tomorrowPrices = await getPricesForDate(today.add(1, 'day'));
                        upcomingPrices = [...remainingToday, ...tomorrowPrices];
                    } catch (tomorrowError) {
                        if (!(tomorrowError instanceof Error) || tomorrowError.name !== 'AbortError') {
                            console.warn('Tomorrow prices are not available yet');
                        }
                    }
                }

                setPrices(
                    upcomingPrices.slice(0, 24).map((price: PriceDetails) => ({
                        ...price,
                        price: Math.max(0, price.price),
                    })),
                );
            } catch (requestError) {
                if (!(requestError instanceof Error) || requestError.name !== 'AbortError') {
                    setError(requestError instanceof Error ? requestError : new Error('Unable to load prices'));
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadPrices();

        return () => controller.abort();
    }, [refreshKey]);

    return (
        <PricesContext.Provider
            value={{ prices: nextPrices, bestPrice, worstPrice, avgPrice, currentPrice, bestPrices, loading, error, refreshPrices }}
        >
            {children}
        </PricesContext.Provider>
    );
};