import { describe, beforeEach, afterEach, expect, jest } from '@jest/globals';

// Save and restore fetch between tests
let originalFetch;

beforeEach(() => {
  originalFetch = global.fetch;
  process.env.HOLIDAY_API_KEY = 'test-api-key';
  process.env.HOLIDAY_API_BASE_URL = 'https://holidays.abstractapi.com/v1';
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.HOLIDAY_API_KEY;
  delete process.env.HOLIDAY_API_BASE_URL;
});

const { fetchHolidays } = await import('../src/utils/holidayApi.js');

const mockFetch = (body, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  });
};

describe('holidayApi.fetchHolidays', () => {
  it('throws when HOLIDAY_API_KEY is missing', async () => {
    delete process.env.HOLIDAY_API_KEY;

    await expect(fetchHolidays()).rejects.toThrow('HOLIDAY_API_KEY is missing');
  });

  it('calls Abstract Holidays API with CA country hardcoded', async () => {
    mockFetch({ holidays: [] });

    await fetchHolidays({ year: 2026, month: 7, day: 1 });

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain('country=CA');
    expect(calledUrl).toContain('abstractapi.com');
  });

  it('returns holidays array on success', async () => {
    const holidays = [
      { name: 'Canada Day', date: '2026-07-01', country: 'CA' },
    ];
    mockFetch({ holidays });

    const result = await fetchHolidays({ year: 2026, month: 7, day: 1 });

    expect(result).toEqual(holidays);
  });

  it('returns empty array when no holidays on that day', async () => {
    mockFetch({ holidays: [] });

    const result = await fetchHolidays({ year: 2026, month: 4, day: 2 });

    expect(result).toEqual([]);
  });

  it('passes year, month, day as query params', async () => {
    mockFetch({ holidays: [] });

    await fetchHolidays({ year: 2026, month: 12, day: 25 });

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain('year=2026');
    expect(calledUrl).toContain('month=12');
    expect(calledUrl).toContain('day=25');
  });

  it('throws on non-OK API response', async () => {
    mockFetch({ error: 'Unauthorized' }, 401);

    await expect(fetchHolidays({ year: 2026, month: 7, day: 1 })).rejects.toThrow(
      'Holiday API request failed (401)',
    );
  });
});
