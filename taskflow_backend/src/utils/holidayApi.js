const getHolidayApiConfig = () => {
  const apiKey = process.env.HOLIDAY_API_KEY;
  const baseUrl = process.env.HOLIDAY_API_BASE_URL || 'https://holidays.abstractapi.com/v1';

  if (!apiKey) {
    throw new Error('HOLIDAY_API_KEY is missing from environment variables');
  }

  return { apiKey, baseUrl: baseUrl.replace(/\/$/, '') };
};

const toIntOrUndefined = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const fetchHolidays = async ({ year, month, day } = {}) => {
  const { apiKey, baseUrl } = getHolidayApiConfig();
  const isAbstractApi = baseUrl.includes('abstractapi.com');

  const currentYear = new Date().getFullYear();
  const today = new Date();
  const params = new URLSearchParams({
    api_key: apiKey,
    key: apiKey,
    country: 'CA',
    year: String(toIntOrUndefined(year) || currentYear),
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

  const endpoint = isAbstractApi
    ? `${baseUrl}/?${params.toString()}`
    : `${baseUrl}/holidays?${params.toString()}`;
  const response = await fetch(endpoint, {
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
  return payload.holidays || [];
};

export default fetchHolidays;
