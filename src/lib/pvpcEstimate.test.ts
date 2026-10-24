import { describe, expect, it } from 'vitest';
import type { OmiePrice } from './omie';
import type { PVPCPriceEntry } from './pvpcCache';
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
  it('adjusts hourly OMIE changes by the change in the daily average using the BOE weights', () => {
    const nextOMIE: OmiePrice[] = [
      { date: '2026-10-12T00:00:00+02:00', price: 20000 },
      { date: '2026-10-12T01:00:00+02:00', price: 5000 },
    ];

    expect(estimatePVPCPrices(previousPVPC, previousOMIE, nextOMIE)).toEqual([
      { date: '2026-10-12T00:00:00+02:00', price: 18625, simulated: true },
      { date: '2026-10-12T01:00:00+02:00', price: 5625, simulated: true },
    ]);
  });

  it('uses the transitional daily-market weights from the BOE', () => {
    const nextOMIE: OmiePrice[] = [
      { date: '2025-01-01T00:00:00+01:00', price: 20000 },
      { date: '2025-01-01T01:00:00+01:00', price: 20000 },
    ];

    expect(estimatePVPCPrices(previousPVPC, previousOMIE, nextOMIE)).toEqual([
      { date: '2025-01-01T00:00:00+01:00', price: 16000, simulated: true },
      { date: '2025-01-01T01:00:00+01:00', price: 18000, simulated: true },
    ]);
  });

  it('estimates from the previous PVPC market and adjustment components when available', () => {
    const componentPrices: PVPCPriceEntry[] = previousPVPC.map((entry) => ({
      ...entry,
      PMHPCB: '100,00',
      TAHPCB: '0,00',
    }));
    const nextOMIE: OmiePrice[] = [
      { date: '2026-10-12T00:00:00+02:00', price: 20000 },
      { date: '2026-10-12T01:00:00+02:00', price: 5000 },
    ];

    expect(estimatePVPCPrices(componentPrices, previousOMIE, nextOMIE)).toEqual(
      [
        { date: '2026-10-12T00:00:00+02:00', price: 18625, simulated: true },
        { date: '2026-10-12T01:00:00+02:00', price: 5625, simulated: true },
      ],
    );
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
