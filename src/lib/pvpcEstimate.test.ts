/// <reference types="jest" />

import type { PVPCPriceEntry } from './pvpcCache';
import type { OmiePrice } from './omie';
import { estimatePVPCPrices } from './pvpcEstimate';
import { getExpectedPVPCHours } from './pvpcPrices';

const previousPVPC: PVPCPriceEntry[] = [
  { Dia: '11/10/2026', Hora: '00-01', PCB: '100,00' },
  { Dia: '11/10/2026', Hora: '01-02', PCB: '120,00' },
];

const previousOMIE: OmiePrice[] = [
  { date: '2026-10-11T00:00:00+02:00', price: 10000 },
  { date: '2026-10-11T01:00:00+02:00', price: 10000 },
];

describe('estimatePVPCPrices', () => {
  it('adjusts the previous PVPC by the weighted change in the OMIE hourly price', () => {
    const nextOMIE: OmiePrice[] = [
      { date: '2026-10-12T00:00:00+02:00', price: 20000 },
      { date: '2026-10-12T01:00:00+02:00', price: 5000 },
    ];

    expect(estimatePVPCPrices(previousPVPC, previousOMIE, nextOMIE)).toEqual([
      { date: '2026-10-12T00:00:00+02:00', price: 14500, simulated: true },
      { date: '2026-10-12T01:00:00+02:00', price: 9750, simulated: true },
    ]);
  });

  it('rejects incomplete reference data', () => {
    expect(() => estimatePVPCPrices([], previousOMIE, previousOMIE)).toThrow(
      'Insufficient hourly PVPC and OMIE data',
    );
  });
});

describe('getExpectedPVPCHours', () => {
  it('accounts for the daylight-saving transition days in Spain', () => {
    expect(getExpectedPVPCHours('2026-03-29')).toBe(23);
    expect(getExpectedPVPCHours('2026-10-25')).toBe(25);
  });
});
