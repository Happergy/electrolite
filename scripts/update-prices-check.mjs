import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { expectedHoursInDay, parseOmieCsv } from './update-prices.mjs';

describe('scheduled price ingestion', () => {
  it('accepts regular 24-period OMIE days and converts EUR/MWh to hundredths', () => {
    const csv = [
      'MARGINALPDBC;',
      ...Array.from({ length: 24 }, (_, hour) => `2026;10;24;${hour + 1};120;120;`),
    ].join('\n');

    const prices = parseOmieCsv(csv, '2026-10-24');

    assert.equal(prices.length, 24);
    assert.deepEqual(prices[0], { date: '2026-10-24T00:00:00+02:00', price: 12000 });
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
      ...Array.from({ length: 23 }, (_, hour) => `2026;3;29;${hour + 1};120;120;`),
    ].join('\n');
    const autumnCsv = [
      'MARGINALPDBC;',
      ...Array.from({ length: 25 }, (_, hour) => `2026;10;25;${hour + 1};120;120;`),
    ].join('\n');

    assert.equal(expectedHoursInDay('2026-03-29'), 23);
    assert.equal(parseOmieCsv(springCsv, '2026-03-29').length, 23);
    assert.equal(expectedHoursInDay('2026-10-25'), 25);
    assert.equal(parseOmieCsv(autumnCsv, '2026-10-25').length, 25);
    assert.deepEqual(parseOmieCsv(autumnCsv, '2026-10-25').slice(2, 4).map(({ date }) => date), [
      '2026-10-25T02:00:00+02:00',
      '2026-10-25T02:00:00+01:00',
    ]);
  });

  it('rejects incomplete OMIE periods', () => {
    assert.throws(
      () => parseOmieCsv('MARGINALPDBC;\n2026;10;24;1;120;120;', '2026-10-24'),
      /OMIE data is incomplete for 2026-10-24\./,
    );
  });
});
