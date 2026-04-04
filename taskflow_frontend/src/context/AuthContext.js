import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setTokenExpirationHandler } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext({
  user: null,
  token: null,
  initializing: true,
  authLoading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateStoredUser: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const { showToast } = useToast();

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    window.sessionStorage.removeItem('rga:token');
    window.sessionStorage.removeItem('rga:user');
  }, []);

  // Setup token expiration handler
  useEffect(() => {
    setTokenExpirationHandler(() => {
      showToast(
        'Your session has expired. Please login again to continue.',
        'error',
        {
          label: 'Logout & Login',
          onClick: logout,
        }
      );
    });
  }, [showToast, logout]);

  useEffect(() => {
    const storedToken = window.sessionStorage.getItem('rga:token');
    const storedUser = window.sessionStorage.getItem('rga:user');

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user', error);
      }
    }

    setInitializing(false);
  }, []);

  useEffect(() => {
    if (token) {
      window.sessionStorage.setItem('rga:token', token);
    } else {
      window.sessionStorage.removeItem('rga:token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      window.sessionStorage.setItem('rga:user', JSON.stringify(user));
    } else {
      window.sessionStorage.removeItem('rga:user');
    }
  }, [user]);

  const login = useCallback(async (credentials) => {
    setAuthLoading(true);
    try {
      const data = await api.login(credentials);
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const register = useCallback(async (payload, options = { autoLogin: false }) => {
    setAuthLoading(true);
    try {
      const data = await api.register(payload);

      if (options.autoLogin) {
        setToken(data.token);
        setUser(data.user);
      }

      return data;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const updateStoredUser = useCallback((nextValue) => {
    setUser((prev) => (typeof nextValue === 'function' ? nextValue(prev) : nextValue));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      authLoading,
      login,
      register,
      logout,
      isAuthenticated: Boolean(token),
      updateStoredUser,
    }),
    [user, token, initializing, authLoading, login, register, logout, updateStoredUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
