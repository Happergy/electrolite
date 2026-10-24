import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPVPC } from './pvpcPrices';

const mockResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

const installFetchMock = (...responses: Response[]) => {
  const fetchMock = vi.fn();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: fetchMock,
  });
  return fetchMock;
};

const formatHour = (hour: number): string =>
  hour < 10 ? `0${hour}` : String(hour);

describe('getPVPC local daily JSON', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'fetch');
  });

  it('loads PVPC from the local daily JSON file', async () => {
    const prices = Array.from({ length: 24 }, (_, hour) => ({
      Dia: '12/10/2026',
      Hora: `${formatHour(hour)}-${formatHour(hour + 1)}`,
      PCB: '120,00',
    }));
    const fetchMock = installFetchMock(mockResponse(200, { PVPC: prices }));

    const result = await getPVPC('2026-10-12');

    expect(result).toHaveLength(24);
    expect(result[0]).toEqual({
      PCB: '120,00',
      Dia: '12/10/2026',
      Hora: '00-01',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'prices/20261012-pvpc.json',
    );
  });

  it('does not query ESIOS if the local daily file is missing', async () => {
    const fetchMock = installFetchMock(mockResponse(404, null));

    expect(await getPVPC('2026-10-12')).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'prices/20261012-pvpc.json',
    );
  });
});
