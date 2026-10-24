import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import Papa from 'papaparse';
import { access, mkdir, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

dayjs.extend(utc);
dayjs.extend(timezone);

const MADRID_TZ = 'Europe/Madrid';
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, '..');
const pricesDirectory = resolve(projectDirectory, 'public/prices');

export const expectedHoursInDay = (date) => {
  const start = dayjs.tz(date, MADRID_TZ).startOf('day');
  const nextDay = start.add(1, 'day').format('YYYY-MM-DD');
  return dayjs.tz(nextDay, MADRID_TZ).startOf('day').diff(start, 'hour');
};

const isValidPVPCPayload = (payload, date) => {
  if (!Array.isArray(payload?.PVPC)) {
    return false;
  }

  const expectedDate = dayjs.tz(date, MADRID_TZ).format('DD/MM/YYYY');
  return (
    payload.PVPC.length === expectedHoursInDay(date) &&
    payload.PVPC.every(
      ({ PCB, Dia, Hora }) =>
        Dia === expectedDate &&
        /^\d{2}-\d{2}$/.test(Hora) &&
        Number.isFinite(Number.parseFloat(String(PCB).replace(',', '.'))),
    )
  );
};

export const parseOmieCsv = (csv, date) => {
  const rows = Papa.parse(csv, {
    delimiter: ';',
    comments: 'MARGINALPDBC',
    skipEmptyLines: true,
  }).data.flatMap((item) => {
    if (!Array.isArray(item)) {
      return [];
    }

    const [year, month, day, period] = item.slice(0, 4).map(Number);
    const price = Number.parseFloat(String(item[5] ?? '').replace(',', '.'));
    if (
      ![year, month, day, period, price].every(Number.isFinite) ||
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` !== date ||
      period < 1
    ) {
      return [];
    }

    return [{ period, price }];
  });

  const expectedHours = expectedHoursInDay(date);
  const hasQuarterHours = rows.some(({ period }) => period > 25);
  const periodsPerDay = expectedHours * (hasQuarterHours ? 4 : 1);
  const periodNumbers = new Set(rows.map(({ period }) => period));

  if (
    rows.length !== periodsPerDay ||
    periodNumbers.size !== periodsPerDay ||
    Array.from({ length: periodsPerDay }, (_, index) => index + 1).some(
      (period) => !periodNumbers.has(period),
    )
  ) {
    throw new Error(`OMIE data is incomplete for ${date}.`);
  }

  const hourlyPrices = new Map();
  for (const { period, price } of rows) {
    const hourIndex = Math.floor((period - 1) / (hasQuarterHours ? 4 : 1));
    const entry = hourlyPrices.get(hourIndex) ?? { total: 0, count: 0 };
    entry.total += price;
    entry.count += 1;
    hourlyPrices.set(hourIndex, entry);
  }

  return Array.from(hourlyPrices, ([hourIndex, { total, count }]) => {
    const timestamp = dayjs
      .tz(`${date} 00:00`, MADRID_TZ)
      .utc()
      .add(hourIndex, 'hour')
      .tz(MADRID_TZ);

    return {
      date: timestamp.format(),
      price: Math.round((total / count) * 100),
    };
  });
};

const fileExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

const writeJSON = async (path, value) => {
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, path);
};

export const pruneOldPriceFiles = async ({ today, tomorrow, directory = pricesDirectory }) => {
  const retainedDates = new Set([today, tomorrow].map((date) => date.replaceAll('-', '')));
  const entries = await readdir(directory, { withFileTypes: true });
  let removed = 0;

  for (const entry of entries) {
    const match = /^(\d{8})-(?:omie|pvpc)\.json$/.exec(entry.name);
    if (!entry.isFile() || !match || retainedDates.has(match[1])) {
      continue;
    }

    await unlink(resolve(directory, entry.name));
    console.log(`Removed ${entry.name}.`);
    removed += 1;
  }

  return removed;
};

const requestPVPC = async (date) => {
  const response = await fetch(`https://api.esios.ree.es/archives/70/download_json?date=${date}`);
  if (response.status === 404 || response.status === 204) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`ESIOS returned HTTP ${response.status} for ${date}.`);
  }

  const payload = await response.json();
  if (!isValidPVPCPayload(payload, date)) {
    return null;
  }
  return payload;
};

const requestOMIE = async (date) => {
  const fileDate = date.replaceAll('-', '');
  const url = `https://www.omie.es/es/file-download?parents=marginalpdbc&filename=marginalpdbc_${fileDate}.1`;
  const response = await fetch(url);
  if (response.status === 404 || response.status === 204) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`OMIE returned HTTP ${response.status} for ${date}.`);
  }

  return parseOmieCsv(await response.text(), date);
};

const refreshFile = async ({ source, date, isToday }) => {
  const fileDate = date.replaceAll('-', '');
  const fileName = `${fileDate}-${source}.json`;
  const filePath = resolve(pricesDirectory, fileName);

  if (await fileExists(filePath)) {
    console.log(`${fileName} already exists; skipping.`);
    return false;
  }

  const data = source === 'pvpc' ? await requestPVPC(date) : await requestOMIE(date);
  if (data === null) {
    const message = `${source.toUpperCase()} prices are not published or complete for ${date}.`;
    if (isToday) {
      throw new Error(message);
    }
    console.log(message);
    return false;
  }

  await mkdir(pricesDirectory, { recursive: true });
  await writeJSON(filePath, data);
  console.log(`Saved ${fileName}.`);
  return true;
};

export const updatePrices = async (now = new Date()) => {
  const today = dayjs(now).tz(MADRID_TZ).format('YYYY-MM-DD');
  const tomorrow = dayjs.tz(today, MADRID_TZ).add(1, 'day').format('YYYY-MM-DD');
  const failures = [];
  let changed = false;

  for (const date of [today, tomorrow]) {
    for (const source of ['omie', 'pvpc']) {
      try {
        changed = (await refreshFile({ source, date, isToday: date === today })) || changed;
      } catch (error) {
        failures.push(error);
        console.error(error);
      }
    }
  }

  if (changed) {
    try {
      await pruneOldPriceFiles({ today, tomorrow });
    } catch (error) {
      failures.push(error);
      console.error(error);
    }
  }

  if (failures.length > 0) {
    throw new AggregateError(failures, 'Failed to update one or more required daily price files.');
  }

  return changed;
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  updatePrices().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
