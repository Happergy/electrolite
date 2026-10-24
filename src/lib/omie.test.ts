/// <reference types="jest" />

import { getOmie } from './omie';

const formatHour = (hour: number): string => (hour < 10 ? `0${hour}` : String(hour));

const mockResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

const installFetchMock = (...responses: Response[]) => {
  const fetchMock = jest.fn();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: fetchMock });
  return fetchMock;
};

describe('getOmie local daily JSON', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'fetch');
  });

  it('loads a complete day from the local JSON file', async () => {
    const githubPrices = Array.from({ length: 24 }, (_, hour) => ({
      date: `2026-10-12T${formatHour(hour)}:00:00+02:00`,
      price: 12000,
    }));
    const fetchMock = installFetchMock(mockResponse(200, githubPrices));

    const prices = await getOmie('2026-10-12');

    expect(prices).toEqual(githubPrices);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe('prices/20261012-omie.json');
  });

  it('does not query OMIE directly when the local daily file is missing', async () => {
    const fetchMock = installFetchMock(mockResponse(404, null));

    await expect(getOmie('2026-10-13')).rejects.toThrow('OMIE returned no hourly prices for 20261013');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe('prices/20261013-omie.json');
  });

  it('does not query OMIE directly when the local day is incomplete', async () => {
    const incompletePrices = Array.from({ length: 23 }, (_, hour) => ({
      date: `2026-10-14T${formatHour(hour)}:00:00+02:00`,
      price: 12000,
    }));
    const fetchMock = installFetchMock(mockResponse(200, incompletePrices));

    await expect(getOmie('2026-10-14')).rejects.toThrow('OMIE returned no hourly prices for 20261014');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe('prices/20261014-omie.json');
  });
});
