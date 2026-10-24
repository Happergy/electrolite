import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const MADRID_TZ = 'Europe/Madrid';
const DATABASE_NAME = 'electralite-pvpc';
const DATABASE_VERSION = 2;
const STORE_NAMES = ['pvpc', 'omie'] as const;

export type PriceSource = (typeof STORE_NAMES)[number];

type CachedPriceData<T> = {
  date: string;
  data: T[];
  fetchedAt: number;
  expiresAt?: number;
};

export type CacheOptions<T> = {
  negativeTTL: number;
  maxAge?: (data: T[]) => number | undefined;
};

const inFlightRequests = new Map<string, Promise<unknown[]>>();

export const normalizePriceDate = (date: string): string => {
  const trimmedDate = date.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    return trimmedDate;
  }

  if (/^\d{8}$/.test(trimmedDate)) {
    return `${trimmedDate.slice(0, 4)}-${trimmedDate.slice(4, 6)}-${trimmedDate.slice(6, 8)}`;
  }

  const parsedDate = /(?:Z|[+-]\d{2}:?\d{2})$/.test(trimmedDate)
    ? dayjs(trimmedDate).tz(MADRID_TZ)
    : dayjs.tz(trimmedDate, MADRID_TZ);

  if (!parsedDate.isValid()) {
    throw new Error(`Invalid price cache date: ${date}`);
  }

  return parsedDate.format('YYYY-MM-DD');
};

const openPriceDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      for (const storeName of STORE_NAMES) {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: 'date' });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open price cache'));
  });

export const initializePriceCache = async (): Promise<void> => {
  const database = await openPriceDatabase();
  database.close();
};

const readPriceData = async <T>(source: PriceSource, date: string): Promise<T[] | null> => {
  if (!('indexedDB' in globalThis)) {
    return null;
  }

  const database = await openPriceDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(source, 'readonly');
    const request = transaction.objectStore(source).get(date);
    let data: T[] | null = null;

    request.onsuccess = () => {
      const cached = request.result as CachedPriceData<T> | undefined;
      if (
        cached &&
        Array.isArray(cached.data) &&
        (cached.expiresAt === undefined || cached.expiresAt > Date.now())
      ) {
        data = cached.data;
      }
    };

    request.onerror = () => reject(request.error ?? new Error(`Unable to read ${source} cache`));
    transaction.oncomplete = () => {
      database.close();
      resolve(data);
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error(`Unable to read ${source} cache`));
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error(`Unable to read ${source} cache`));
    };
  });
};

const savePriceData = async <T>(
  source: PriceSource,
  date: string,
  data: T[],
  ttl: number | undefined,
): Promise<void> => {
  if (!('indexedDB' in globalThis)) {
    return;
  }

  const database = await openPriceDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(source, 'readwrite');
    const entry: CachedPriceData<T> = {
      date,
      data,
      fetchedAt: Date.now(),
      ...(ttl === undefined ? {} : { expiresAt: Date.now() + ttl }),
    };
    transaction.objectStore(source).put(entry);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error(`Unable to save ${source} cache`));
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error(`Unable to save ${source} cache`));
    };
  });
};

const readPriceDataSafely = async <T>(source: PriceSource, date: string): Promise<T[] | null> => {
  try {
    return await readPriceData<T>(source, date);
  } catch (error) {
    console.warn(`Unable to read ${source} price cache; using the network.`, error);
    return null;
  }
};

export const getCachedPriceData = async <T>(
  source: PriceSource,
  date: string,
  load: () => Promise<T[]>,
  options: CacheOptions<T>,
): Promise<T[]> => {
  const normalizedDate = normalizePriceDate(date);
  const cacheKey = `${source}:${normalizedDate}`;
  const cached = await readPriceDataSafely<T>(source, normalizedDate);

  if (cached !== null) {
    return cached;
  }

  const existingRequest = inFlightRequests.get(cacheKey);
  if (existingRequest) {
    return existingRequest as Promise<T[]>;
  }

  const fetchAndCache = async (): Promise<T[]> => {
    const cachedAfterLock = await readPriceDataSafely<T>(source, normalizedDate);
    if (cachedAfterLock !== null) {
      return cachedAfterLock;
    }

    const data = await load();
    const ttl = data.length === 0 ? options.negativeTTL : options.maxAge?.(data);

    try {
      await savePriceData(source, normalizedDate, data, ttl);
    } catch (error) {
      console.warn(`Unable to save ${source} price cache.`, error);
    }

    return data;
  };

  const request =
    typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request(`electralite:${cacheKey}`, { mode: 'exclusive' }, fetchAndCache)
      : fetchAndCache();
  const trackedRequest = request.then(
    (data) => {
      inFlightRequests.delete(cacheKey);
      return data;
    },
    (error: unknown) => {
      inFlightRequests.delete(cacheKey);
      throw error;
    },
  );

  inFlightRequests.set(cacheKey, trackedRequest);
  return trackedRequest;
};
