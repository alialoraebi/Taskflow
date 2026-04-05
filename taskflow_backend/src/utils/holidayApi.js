import Holidays from 'date-holidays';

export const DEFAULT_HOLIDAY_COUNTRY = 'CA';
export const SUPPORTED_HOLIDAY_COUNTRIES = ['CA', 'US', 'GB', 'AU', 'DE', 'FR', 'IN', 'JP', 'MX'];

const HOLIDAY_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
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
const yearHolidayCache = new Map();

export const normalizeHolidayCountry = (country) => {
  const nextCountry = String(country || DEFAULT_HOLIDAY_COUNTRY).trim().toUpperCase();
  return supportedHolidayCountrySet.has(nextCountry) ? nextCountry : DEFAULT_HOLIDAY_COUNTRY;
};

const buildYearCacheKey = (country, year) => `${country}:${year}`;

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

const getCountryLabel = (country) => countryLabels[country] || country;

const dedupeHolidays = (holidays) => {
  if (!Array.isArray(holidays)) {
    return [];
  }

  const seen = new Set();
  return holidays.filter((holiday) => {
    const name = normalizeHolidayName(holiday?.name);
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
  location: '',
});

const getSupplementalCanadianHolidays = (year) => {
  const easterSunday = calculateEasterSunday(year);
  const easterMonday = new Date(easterSunday);
  easterMonday.setDate(easterMonday.getDate() + 1);

  return [
    buildHoliday('Easter Monday', toIsoDate(easterMonday), 'public'),
  ];
};

const getSupplementalHolidays = (country, year) => {
  if (country === 'CA') {
    return getSupplementalCanadianHolidays(year).map((holiday) => ({
      ...holiday,
      location: 'Canada',
    }));
  }

  return [];
};

const normalizeHoliday = (holiday, country) => {
  const date = String(holiday?.date || '').split(' ')[0].trim();
  const name = normalizeHolidayName(holiday?.name);

  if (!date || !name) {
    return null;
  }

  return {
    name,
    date,
    type: holiday?.type || 'observance',
    location: holiday?.location || getCountryLabel(country),
  };
};

const isPublicHoliday = (holiday, country) => {
  if (country === 'CA') {
    return isPublicCanadianHoliday(holiday.name);
  }

  return holiday.type === 'public';
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

const getLocalHolidaysForYear = (country, year) => {
  const normalizedCountry = normalizeHolidayCountry(country);
  const cacheKey = buildYearCacheKey(normalizedCountry, year);
  const cached = yearHolidayCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const hd = new Holidays(normalizedCountry);
  const coreHolidays = hd.getHolidays(year);
  const normalizedHolidays = filterPublicHolidays(
    [...coreHolidays, ...getSupplementalHolidays(normalizedCountry, year)],
    normalizedCountry,
  );

  yearHolidayCache.set(cacheKey, {
    data: normalizedHolidays,
    expiresAt: Date.now() + HOLIDAY_CACHE_TTL_MS,
  });

  return normalizedHolidays;
};

export const fetchHolidays = async ({ country, year, month, day } = {}) => {
  const currentYear = new Date().getFullYear();
  const normalizedCountry = normalizeHolidayCountry(country);
  const normalizedYear = toIntOrUndefined(year) || currentYear;
  const normalizedMonth = toIntOrUndefined(month);
  const normalizedDay = toIntOrUndefined(day);

  return getLocalHolidaysForYear(normalizedCountry, normalizedYear).filter((holiday) => {
    const [, mm, dd] = holiday.date.split('-');

    if (normalizedMonth && Number(mm) !== normalizedMonth) {
      return false;
    }

    if (normalizedDay && Number(dd) !== normalizedDay) {
      return false;
    }

    return true;
  });
};

export const fetchHolidaysForMonth = async ({ country, year, month } = {}) => {
  const normalizedCountry = normalizeHolidayCountry(country);
  const currentDate = new Date();
  const normalizedYear = toIntOrUndefined(year) || currentDate.getFullYear();
  const normalizedMonth = toIntOrUndefined(month) || currentDate.getMonth() + 1;

  if (normalizedMonth < 1 || normalizedMonth > 12) {
    throw new Error('month must be between 1 and 12');
  }

  const daysInMonth = getDaysInMonth(normalizedYear, normalizedMonth);
  const holidaysByDay = {};
  const localHolidays = getLocalHolidaysForYear(normalizedCountry, normalizedYear).filter((holiday) => {
    const [, mm] = holiday.date.split('-');
    return Number(mm) === normalizedMonth;
  });

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    holidaysByDay[toDayKey(normalizedYear, normalizedMonth, dayNumber)] = [];
  }

  localHolidays.forEach((holiday) => {
    holidaysByDay[holiday.date] = dedupeHolidays([...(holidaysByDay[holiday.date] || []), holiday]);
  });

  return holidaysByDay;
};

export default fetchHolidays;
