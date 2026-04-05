const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';
const HOLIDAY_BROWSER_CACHE_PREFIX = 'taskflow:holiday-cache:v1';
const HOLIDAY_BROWSER_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const holidayBrowserCache = new Map();

// Global handler for token expiration
let tokenExpirationHandler = null;

export const setTokenExpirationHandler = (handler) => {
  tokenExpirationHandler = handler;
};

const getHolidayBrowserCacheKey = (path, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return `${HOLIDAY_BROWSER_CACHE_PREFIX}:${API_BASE_URL}${path}?${query}`;
};

const readHolidayBrowserCache = (cacheKey) => {
  const now = Date.now();
  const memoryEntry = holidayBrowserCache.get(cacheKey);

  if (memoryEntry && memoryEntry.expiresAt > now) {
    return memoryEntry.data;
  }

  holidayBrowserCache.delete(cacheKey);

  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(cacheKey);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    if (!parsed || parsed.expiresAt <= now) {
      window.localStorage.removeItem(cacheKey);
      return null;
    }

    holidayBrowserCache.set(cacheKey, parsed);
    return parsed.data;
  } catch {
    window.localStorage.removeItem(cacheKey);
    return null;
  }
};

const writeHolidayBrowserCache = (cacheKey, data) => {
  const entry = {
    data,
    expiresAt: Date.now() + HOLIDAY_BROWSER_CACHE_TTL_MS,
  };

  holidayBrowserCache.set(cacheKey, entry);

  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    holidayBrowserCache.delete(cacheKey);
  }
};

const requestCachedHoliday = async (path, params, token) => {
  const cacheKey = getHolidayBrowserCacheKey(path, params);
  const cached = readHolidayBrowserCache(cacheKey);

  if (cached) {
    return cached;
  }

  const query = new URLSearchParams(params).toString();
  const payload = await request(`${path}?${query}`, { token, cache: 'no-store' });
  writeHolidayBrowserCache(cacheKey, payload);
  return payload;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // Handle token expiration
    if (response.status === 401) {
      const message = typeof payload === 'string' ? payload : payload?.message;
      const isTokenError = message?.toLowerCase().includes('token') || 
                          message?.toLowerCase().includes('unauthorized');
      
      if (isTokenError && tokenExpirationHandler) {
        tokenExpirationHandler();
      }
    }
    
    const message = typeof payload === 'string' ? payload : payload?.message;
    throw new Error(message || 'Something went wrong while communicating with the server.');
  }

  return payload;
};

const request = async (path, { method = 'GET', body, token, cache } = {}) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    cache,
    body: body ? JSON.stringify(body) : undefined,
  });

  return handleResponse(response);
};

export const api = {
  // User endpoints
  login: (credentials) => request('/users/login', { method: 'POST', body: credentials }),
  register: (payload) => request('/users/register', { method: 'POST', body: payload }),
  updateCurrentUser: (body, token) => request('/users/me', { method: 'PUT', body, token }),
  getUsers: (token) => request('/users', { token }),
  updateUser: (id, body, token) => request(`/users/${id}`, { method: 'PUT', body, token }),
  deleteUser: (id, token) => request(`/users/${id}`, { method: 'DELETE', token }),

  // Project endpoints
  getProjects: (token) => request('/projects', { token }),
  getProject: (id, token) => request(`/projects/${id}`, { token }),
  createProject: (body, token) => request('/projects', { method: 'POST', body, token }),
  updateProject: (id, body, token) => request(`/projects/${id}`, { method: 'PUT', body, token }),
  deleteProject: (id, token) => request(`/projects/${id}`, { method: 'DELETE', token }),

  // Task endpoints
  getTasks: (token) => request('/tasks', { token }),
  getTasksByProject: (projectId, token) => request(`/tasks?project=${projectId}`, { token }),
  getTask: (id, token) => request(`/tasks/${id}`, { token }),
  createTask: (body, token) => request('/tasks', { method: 'POST', body, token }),
  updateTask: (id, body, token) => request(`/tasks/${id}`, { method: 'PUT', body, token }),
  updateTaskStatus: (id, status, token) => request(`/tasks/${id}/status`, { method: 'PATCH', body: { status }, token }),
  deleteTask: (id, token) => request(`/tasks/${id}`, { method: 'DELETE', token }),

  // Holiday endpoints
  getHolidays: (params, token) => requestCachedHoliday('/holidays', params, token),
  getHolidaysForMonth: (params, token) => requestCachedHoliday('/holidays/month', params, token),
};

export default api;
