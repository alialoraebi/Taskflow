const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';

// Global handler for token expiration
let tokenExpirationHandler = null;

export const setTokenExpirationHandler = (handler) => {
  tokenExpirationHandler = handler;
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

const request = async (path, { method = 'GET', body, token } = {}) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return handleResponse(response);
};

export const api = {
  // User endpoints
  login: (credentials) => request('/users/login', { method: 'POST', body: credentials }),
  register: (payload) => request('/users/register', { method: 'POST', body: payload }),
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
  getTask: (id, token) => request(`/tasks/${id}`, { token }),
  createTask: (body, token) => request('/tasks', { method: 'POST', body, token }),
  updateTask: (id, body, token) => request(`/tasks/${id}`, { method: 'PUT', body, token }),
  updateTaskStatus: (id, status, token) => request(`/tasks/${id}/status`, { method: 'PATCH', body: { status }, token }),
  deleteTask: (id, token) => request(`/tasks/${id}`, { method: 'DELETE', token }),

  // Holiday endpoints
  getHolidays: (params, token) => {
    const query = new URLSearchParams(params).toString();
    return request(`/holidays?${query}`, { token });
  },
};

export default api;
