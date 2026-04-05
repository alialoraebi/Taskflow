import Holidays from 'date-holidays';

const getHolidayApiConfig = () => {
  const apiKey = process.env.ABSTRACT_API_KEY || process.env.HOLIDAY_API_KEY;
  const baseUrl = process.env.HOLIDAY_API_BASE_URL || 'https://holidays.abstractapi.com/v1';

  if (!apiKey) {
    throw new Error('ABSTRACT_API_KEY (or HOLIDAY_API_KEY) is missing from environment variables');
  }

  return { apiKey, baseUrl: baseUrl.replace(/\/$/, '') };
};

const HOLIDAY_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const MIN_REQUEST_INTERVAL_MS = 1200;
const PUBLIC_CANADIAN_HOLIDAY_NAMES = new Set([
  "new year's day",
  "new year's day observed",
  'good friday',
  'easter monday',
  'victoria day',
  'victoria day observed',
  'canada day',
  'canada day observed',
  'civic holiday',
  'labour day',
  'labour day observed',
  'national day for truth and reconciliation',
  'national day for truth and reconciliation observed',
  'thanksgiving',
  'thanksgiving day',
  'remembrance day',
  'remembrance day observed',
  'christmas day',
  'christmas day observed',
  'boxing day',
  'boxing day observed',
]);
const holidayCache = new Map();
const inFlightRequests = new Map();
const monthHolidayCache = new Map();
const inFlightMonthRequests = new Map();
let lastAbstractRequestAt = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildCacheKey = (country, year, month, day) => `${country}:${year}:${month || 'na'}:${day || 'na'}`;
const buildMonthCacheKey = (country, year, month) => `${country}:${year}:${month}`;

const normalizeHolidayPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.holidays)) {
    return payload.holidays;
  }

  return [];
};

const fetchWithAbstractRateLimit = async (endpoint) => {
  const elapsed = Date.now() - lastAbstractRequestAt;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await delay(MIN_REQUEST_INTERVAL_MS - elapsed);
  }

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  lastAbstractRequestAt = Date.now();
  return response;
};

const toIntOrUndefined = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toDayKey = (year, month, day) => {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const normalizeHolidayName = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const isPublicCanadianHoliday = (holidayName) =>
  PUBLIC_CANADIAN_HOLIDAY_NAMES.has(normalizeHolidayName(holidayName).toLowerCase());

const dedupeHolidays = (holidays) => {
  if (!Array.isArray(holidays)) {
    return [];
  }

  const seen = new Set();
  return holidays.filter((holiday) => {
    const name = String(holiday?.name || '').trim();
    const date = String(holiday?.date || '').trim();
    if (!name) {
      return false;
    }

    const key = `${name.toLowerCase()}::${date}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateEasterSunday = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
};

const buildHoliday = (name, date, type = 'observance') => ({
  name,
  date,
  type,
  location: 'Canada',
});

const getSupplementalCanadianHolidays = (year) => {
  const easterSunday = calculateEasterSunday(year);
  const easterMonday = new Date(easterSunday);
  easterMonday.setDate(easterMonday.getDate() + 1);

  return [
    buildHoliday('Easter Monday', toIsoDate(easterMonday), 'public'),
  ];
};

const normalizeHoliday = (holiday) => {
  const date = String(holiday?.date || '').split(' ')[0].trim();
  const name = normalizeHolidayName(holiday?.name);

  if (!date || !name) {
    return null;
  }

  return {
    name,
    date,
    type: holiday?.type || 'observance',
    location: holiday?.location || 'Canada',
  };
};

const filterPublicHolidays = (holidays) =>
  dedupeHolidays(
    holidays
      .map(normalizeHoliday)
      .filter(Boolean)
      .filter((holiday) => isPublicCanadianHoliday(holiday.name))
      .map((holiday) => ({
        ...holiday,
        type: 'public',
      }))
  );

const getLocalCanadianHolidaysForYear = (year) => {
  const hd = new Holidays('CA');
  const coreHolidays = hd.getHolidays(year);
  return filterPublicHolidays([...coreHolidays, ...getSupplementalCanadianHolidays(year)]);
};

const getLocalCanadianHolidaysForDay = ({ year, month, day }) => {
  if (!year || !month || !day) {
    return [];
  }

  const dayKey = toDayKey(year, month, day);
  return getLocalCanadianHolidaysForYear(year).filter((holiday) => holiday.date === dayKey);
};

export const fetchHolidays = async ({ year, month, day } = {}) => {
  const { apiKey, baseUrl } = getHolidayApiConfig();
  const isAbstractApi = baseUrl.includes('abstractapi.com');

  const currentYear = new Date().getFullYear();
  const today = new Date();
  const country = 'CA';
  const normalizedYear = toIntOrUndefined(year) || currentYear;
  const params = new URLSearchParams({
    api_key: apiKey,
    country,
    year: String(normalizedYear),
  });

  let normalizedMonth = toIntOrUndefined(month);
  let normalizedDay = toIntOrUndefined(day);

  // Abstract free plan requires individual day queries.
  if (isAbstractApi && (!normalizedMonth || !normalizedDay)) {
    normalizedMonth = today.getMonth() + 1;
    normalizedDay = today.getDate();
  }

  if (normalizedMonth) {
    params.set('month', String(normalizedMonth));
  }

  if (normalizedDay) {
    params.set('day', String(normalizedDay));
  }

  if (normalizedMonth && normalizedDay) {
    const localHolidays = getLocalCanadianHolidaysForDay({
      year: normalizedYear,
      month: normalizedMonth,
      day: normalizedDay,
    });

    if (localHolidays.length > 0) {
      return localHolidays;
    }
  }

  const cacheKey = buildCacheKey(country, normalizedYear, normalizedMonth, normalizedDay);
  const cached = holidayCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const endpoint = isAbstractApi
    ? `${baseUrl}/?${params.toString()}`
    : `${baseUrl}/holidays?${params.toString()}`;

  const requestPromise = (async () => {
    const response = isAbstractApi
      ? await fetchWithAbstractRateLimit(endpoint)
      : await fetch(endpoint, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Holiday API request failed (${response.status}): ${responseText}`);
    }

    const payload = await response.json();
    const holidays = filterPublicHolidays(normalizeHolidayPayload(payload));

    holidayCache.set(cacheKey, {
      data: holidays,
      expiresAt: Date.now() + HOLIDAY_CACHE_TTL_MS,
    });

    return holidays;
  })();

  inFlightRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
};

export const fetchHolidaysForMonth = async ({ year, month } = {}) => {
  const currentDate = new Date();
  const normalizedYear = toIntOrUndefined(year) || currentDate.getFullYear();
  const normalizedMonth = toIntOrUndefined(month) || currentDate.getMonth() + 1;

  if (normalizedMonth < 1 || normalizedMonth > 12) {
    throw new Error('month must be between 1 and 12');
  }

  const country = 'CA';
  const monthCacheKey = buildMonthCacheKey(country, normalizedYear, normalizedMonth);
  const cachedMonth = monthHolidayCache.get(monthCacheKey);
  if (cachedMonth && Date.now() < cachedMonth.expiresAt) {
    return cachedMonth.data;
  }

  if (inFlightMonthRequests.has(monthCacheKey)) {
    return inFlightMonthRequests.get(monthCacheKey);
  }

  const requestPromise = (async () => {
    const daysInMonth = getDaysInMonth(normalizedYear, normalizedMonth);
    const holidaysByDay = {};
    const localHolidays = getLocalCanadianHolidaysForYear(normalizedYear).filter((holiday) => {
      const [, mm] = holiday.date.split('-');
      return Number(mm) === normalizedMonth;
    });

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dayKey = toDayKey(normalizedYear, normalizedMonth, day);
      holidaysByDay[dayKey] = [];
    }

    localHolidays.forEach((holiday) => {
      if (!holidaysByDay[holiday.date]) {
        holidaysByDay[holiday.date] = [];
      }

      holidaysByDay[holiday.date].push(holiday);
      holidaysByDay[holiday.date] = dedupeHolidays(holidaysByDay[holiday.date]);
    });

    monthHolidayCache.set(monthCacheKey, {
      data: holidaysByDay,
      expiresAt: Date.now() + HOLIDAY_CACHE_TTL_MS,
    });

    return holidaysByDay;
  })();

  inFlightMonthRequests.set(monthCacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightMonthRequests.delete(monthCacheKey);
  }
};

export default fetchHolidays;
