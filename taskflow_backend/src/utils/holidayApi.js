export const DEFAULT_HOLIDAY_COUNTRY = 'CA';
export const SUPPORTED_HOLIDAY_COUNTRIES = ['CA', 'US', 'GB', 'AU', 'DE', 'FR', 'IN', 'JP', 'MX'];

const HOLIDAY_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const BASE_URL = 'https://holidays.abstractapi.com/v1/';
const RATE_LIMIT_DELAY_MS = 1500;
const EXTERNAL_PUBLIC_TYPE_KEYWORDS = ['national', 'public', 'federal', 'bank'];
const countryLabels = {
  CA: 'Canada',
  US: 'United States',
  GB: 'United Kingdom',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  IN: 'India',
  JP: 'Japan',
  MX: 'Mexico',
};

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

const supportedHolidayCountrySet = new Set(SUPPORTED_HOLIDAY_COUNTRIES);
const holidayCache = new Map();

// Read API key lazily at call time — NOT at module level.
// ESM hoists imports above dotenv.config(), so process.env is empty at module load.
const getApiKey = () => (process.env.ABSTRACT_API_KEY || process.env.HOLIDAY_API_KEY || '').trim();

export const normalizeHolidayCountry = (country) => {
  const nextCountry = String(country || DEFAULT_HOLIDAY_COUNTRY).trim().toUpperCase();
  return supportedHolidayCountrySet.has(nextCountry) ? nextCountry : DEFAULT_HOLIDAY_COUNTRY;
};

const buildCacheKey = (scope, country, year, month, day) =>
  [scope, country, year, month ?? '', day ?? ''].join(':');

const readCachedValue = (cacheKey) => {
  const cachedEntry = holidayCache.get(cacheKey);
  if (!cachedEntry) {
    return null;
  }

  if (cachedEntry.expiresAt <= Date.now()) {
    holidayCache.delete(cacheKey);
    return null;
  }

  return cachedEntry.data;
};

const writeCachedValue = (cacheKey, data) => {
  holidayCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + HOLIDAY_CACHE_TTL_MS,
  });

  return data;
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

const normalizeHolidayType = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(', ');
  }

  return String(value || '').trim();
};

const normalizeHolidayDate = (holiday) => {
  if (holiday?.date_year && holiday?.date_month && holiday?.date_day) {
    return `${holiday.date_year}-${String(holiday.date_month).padStart(2, '0')}-${String(holiday.date_day).padStart(2, '0')}`;
  }

  const rawDate = String(holiday?.date || '').trim();
  if (!rawDate) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
    return rawDate.slice(0, 10);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
    const [month, day, year] = rawDate.split('/');
    return `${year}-${month}-${day}`;
  }

  return rawDate.split(' ')[0].trim();
};

const isPublicCanadianHoliday = (holidayName) =>
  PUBLIC_CANADIAN_HOLIDAY_NAMES.has(normalizeHolidayName(holidayName).toLowerCase());

const isPublicHolidayType = (holidayType) => {
  const normalizedType = normalizeHolidayType(holidayType).toLowerCase();

  if (!normalizedType || normalizedType.includes('observance')) {
    return false;
  }

  return EXTERNAL_PUBLIC_TYPE_KEYWORDS.some((keyword) => normalizedType.includes(keyword));
};

const getCountryLabel = (country) => countryLabels[country] || country;

const dedupeHolidays = (holidays) => {
  if (!Array.isArray(holidays)) {
    return [];
  }

  const seen = new Set();
  return holidays.filter((holiday) => {
    const name = normalizeHolidayName(holiday?.name);
    const date = normalizeHolidayDate(holiday);
    if (!name || !date) {
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

const normalizeHoliday = (holiday, country) => {
  const date = normalizeHolidayDate(holiday);
  const name = normalizeHolidayName(holiday?.name);

  if (!date || !name) {
    return null;
  }

  return {
    name,
    date,
    type: normalizeHolidayType(holiday?.type || 'observance'),
    location: holiday?.location || getCountryLabel(country),
  };
};

const isPublicHoliday = (holiday, country) => {
  if (country === 'CA') {
    return isPublicCanadianHoliday(holiday.name);
  }

  return isPublicHolidayType(holiday.type);
};

const filterPublicHolidays = (holidays, country) =>
  dedupeHolidays(
    holidays
      .map((holiday) => normalizeHoliday(holiday, country))
      .filter(Boolean)
      .filter((holiday) => isPublicHoliday(holiday, country))
      .map((holiday) => ({
        ...holiday,
        type: 'public',
      }))
  );

// Helper to avoid rate limiting on the free tier (same as calanderAPITest.js)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch holidays for a single day from the Abstract Holiday API
const fetchExternalHolidaysForDay = async ({ country, year, month, day }) => {
  const normalizedCountry = normalizeHolidayCountry(country);
  const cacheKey = buildCacheKey('external-day', normalizedCountry, year, month, day);
  const cached = readCachedValue(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Missing HOLIDAY_API_KEY or ABSTRACT_API_KEY in .env');
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    country: normalizedCountry,
    year: String(year),
    month: String(month),
    day: String(day),
  });

  const response = await fetch(`${BASE_URL}?${params.toString()}`, {
    signal: AbortSignal.timeout(10000),
  });

  const responseText = await response.text();
  let payload;

  try {
    payload = responseText ? JSON.parse(responseText) : [];
  } catch {
    payload = responseText;
  }

  if (!response.ok) {
    const message = typeof payload === 'string'
      ? payload
      : payload?.error?.message || payload?.message || response.statusText;
    const error = new Error(message || 'Holiday API request failed.');
    error.status = response.status;
    throw error;
  }

  const holidays = filterPublicHolidays(Array.isArray(payload) ? payload : [], normalizedCountry);
  return writeCachedValue(cacheKey, holidays);
};

export const fetchHolidays = async ({ country, year, month, day } = {}) => {
  const currentYear = new Date().getFullYear();
  const normalizedCountry = normalizeHolidayCountry(country);
  const normalizedYear = toIntOrUndefined(year) || currentYear;
  const normalizedMonth = toIntOrUndefined(month);
  const normalizedDay = toIntOrUndefined(day);

  if (normalizedMonth && normalizedDay) {
    return fetchExternalHolidaysForDay({
      country: normalizedCountry,
      year: normalizedYear,
      month: normalizedMonth,
      day: normalizedDay,
    });
  }

  if (normalizedMonth) {
    const holidaysByDay = await fetchHolidaysForMonth({
      country: normalizedCountry,
      year: normalizedYear,
      month: normalizedMonth,
    });

    return Object.values(holidaysByDay).flat();
  }

  // Year-level: query each month
  const allHolidays = [];
  for (let m = 1; m <= 12; m += 1) {
    const holidaysByDay = await fetchHolidaysForMonth({
      country: normalizedCountry,
      year: normalizedYear,
      month: m,
    });
    allHolidays.push(...Object.values(holidaysByDay).flat());
  }
  return dedupeHolidays(allHolidays);
};

export const fetchHolidaysForMonth = async ({ country, year, month } = {}) => {
  const normalizedCountry = normalizeHolidayCountry(country);
  const currentDate = new Date();
  const normalizedYear = toIntOrUndefined(year) || currentDate.getFullYear();
  const normalizedMonth = toIntOrUndefined(month) || currentDate.getMonth() + 1;

  if (normalizedMonth < 1 || normalizedMonth > 12) {
    throw new Error('month must be between 1 and 12');
  }

  const cacheKey = buildCacheKey('external-month', normalizedCountry, normalizedYear, normalizedMonth);
  const cached = readCachedValue(cacheKey);
  if (cached) {
    return cached;
  }

  const daysInMonth = getDaysInMonth(normalizedYear, normalizedMonth);
  const holidaysByDay = {};

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    holidaysByDay[toDayKey(normalizedYear, normalizedMonth, dayNumber)] = [];
  }

  // Query each day from the Abstract Holiday API with rate-limit delays (like calanderAPITest.js)
  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    try {
      const holidays = await fetchExternalHolidaysForDay({
        country: normalizedCountry,
        year: normalizedYear,
        month: normalizedMonth,
        day: dayNumber,
      });

      if (holidays.length > 0) {
        const dayKey = toDayKey(normalizedYear, normalizedMonth, dayNumber);
        holidaysByDay[dayKey] = dedupeHolidays([...(holidaysByDay[dayKey] || []), ...holidays]);
      }
    } catch (error) {
      console.warn(
        `Holiday API failed for ${normalizedCountry} ${toDayKey(normalizedYear, normalizedMonth, dayNumber)}: ${error.message}`,
      );
    }

    // Rate-limit delay between API calls (free tier = 1 req/sec)
    await delay(RATE_LIMIT_DELAY_MS);
  }

  return writeCachedValue(cacheKey, holidaysByDay);
};

export default fetchHolidays;
