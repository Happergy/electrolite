import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  expectedHoursInDay,
  minimizePVPCPayload,
  parseOmieCsv,
  pruneOldPriceFiles,
} from './update-prices.mjs';

describe('scheduled price ingestion', () => {
  it('accepts regular 24-period OMIE days and converts EUR/MWh to hundredths', () => {
    const csv = [
      'MARGINALPDBC;',
      ...Array.from(
        { length: 24 },
        (_, hour) => `2026;10;24;${hour + 1};120;120;`,
      ),
    ].join('\n');

    const prices = parseOmieCsv(csv, '2026-10-24');

    assert.equal(prices.length, 24);
    assert.deepEqual(prices[0], {
      date: '2026-10-24T00:00:00+02:00',
      price: 12000,
    });
  });

  it('averages four quarter-hour prices to one hourly price', () => {
    const csv = [
      'MARGINALPDBC;',
      ...Array.from({ length: 96 }, (_, index) => {
        const price = index < 4 ? [10, 20, 30, 40][index] : 50;
        return `2026;10;24;${index + 1};${price};${price};`;
      }),
    ].join('\n');

    assert.deepEqual(parseOmieCsv(csv, '2026-10-24').slice(0, 2), [
      { date: '2026-10-24T00:00:00+02:00', price: 2500 },
      { date: '2026-10-24T01:00:00+02:00', price: 5000 },
    ]);
  });

  it('preserves 23 and 25 hourly periods across Madrid daylight-saving changes', () => {
    const springCsv = [
      'MARGINALPDBC;',
      ...Array.from(
        { length: 23 },
        (_, hour) => `2026;3;29;${hour + 1};120;120;`,
      ),
    ].join('\n');
    const autumnCsv = [
      'MARGINALPDBC;',
      ...Array.from(
        { length: 25 },
        (_, hour) => `2026;10;25;${hour + 1};120;120;`,
      ),
    ].join('\n');

    assert.equal(expectedHoursInDay('2026-03-29'), 23);
    assert.equal(parseOmieCsv(springCsv, '2026-03-29').length, 23);
    assert.equal(expectedHoursInDay('2026-10-25'), 25);
    assert.equal(parseOmieCsv(autumnCsv, '2026-10-25').length, 25);
    assert.deepEqual(
      parseOmieCsv(autumnCsv, '2026-10-25')
        .slice(2, 4)
        .map(({ date }) => date),
      ['2026-10-25T02:00:00+02:00', '2026-10-25T02:00:00+01:00'],
    );
  });

  it('rejects incomplete OMIE periods', () => {
    assert.throws(
      () => parseOmieCsv('MARGINALPDBC;\n2026;10;24;1;120;120;', '2026-10-24'),
      /OMIE data is incomplete for 2026-10-24\./,
    );
  });

  it('keeps the PVPC fields used for component-based estimation', () => {
    const result = minimizePVPCPayload(
      {
        PVPC: Array.from({ length: 24 }, (_, hour) => ({
          Dia: '24/10/2026',
          Hora: `${String(hour).padStart(2, '0')}-${String(hour + 1).padStart(2, '0')}`,
          PCB: '228,20',
          PMHPCB: '236,94',
          TAHPCB: '-38,76',
          SAHPCB: '19,59',
          CYM: '228,20',
          COF2TD: '0,000101531267000000',
          unused: 'not copied',
        })),
        metadata: { origin: 'ESIOS' },
      },
      '2026-10-24',
    );

    assert.deepEqual(Object.keys(result), ['PVPC']);
    assert.deepEqual(result.PVPC[0], {
      Dia: '24/10/2026',
      Hora: '00-01',
      PCB: '228,20',
      PMHPCB: '236,94',
      TAHPCB: '-38,76',
    });
  });

  it('keeps today and tomorrow prices and removes other daily price files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'electrolite-prices-'));
    const filenames = [
      '20261023-omie.json',
      '20261024-pvpc.json',
      '20261025-omie.json',
      '20261026-pvpc.json',
      'not-a-price.json',
    ];

    try {
      await Promise.all(
        filenames.map((filename) => writeFile(join(directory, filename), '{}')),
      );

      assert.equal(
        await pruneOldPriceFiles({
          today: '2026-10-24',
          tomorrow: '2026-10-25',
          directory,
        }),
        2,
      );
      assert.deepEqual((await readdir(directory)).sort(), [
        '20261024-pvpc.json',
        '20261025-omie.json',
        'not-a-price.json',
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
