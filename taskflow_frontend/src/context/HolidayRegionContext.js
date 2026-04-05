import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const HOLIDAY_REGION_STORAGE_KEY = 'taskflow:holiday-region';

export const HOLIDAY_REGION_OPTIONS = [
  { value: 'CA', label: 'Canada' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' },
  { value: 'MX', label: 'Mexico' },
];

const supportedRegionCodes = new Set(HOLIDAY_REGION_OPTIONS.map((option) => option.value));

const normalizeHolidayRegion = (value) => {
  const nextRegion = String(value || 'CA').trim().toUpperCase();
  return supportedRegionCodes.has(nextRegion) ? nextRegion : 'CA';
};

const HolidayRegionContext = createContext({
  holidayRegion: 'CA',
  holidayRegionOptions: HOLIDAY_REGION_OPTIONS,
  setHolidayRegion: () => {},
});

const getInitialHolidayRegion = () => {
  if (typeof window === 'undefined') {
    return 'CA';
  }

  return normalizeHolidayRegion(window.localStorage.getItem(HOLIDAY_REGION_STORAGE_KEY));
};

export const HolidayRegionProvider = ({ children }) => {
  const { token, user, updateStoredUser } = useAuth();
  const { showToast } = useToast();
  const [holidayRegion, setHolidayRegionState] = useState(getInitialHolidayRegion);

  useEffect(() => {
    if (!user?.holidayRegion) {
      return;
    }

    const nextRegion = normalizeHolidayRegion(user.holidayRegion);
    setHolidayRegionState((current) => (current === nextRegion ? current : nextRegion));
  }, [user?.holidayRegion]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(HOLIDAY_REGION_STORAGE_KEY, holidayRegion);
    }
  }, [holidayRegion]);

  const setHolidayRegion = useCallback(
    async (value) => {
      const nextRegion = normalizeHolidayRegion(value);
      const previousRegion = normalizeHolidayRegion(user?.holidayRegion || holidayRegion);

      if (nextRegion === holidayRegion && nextRegion === previousRegion) {
        return;
      }

      setHolidayRegionState(nextRegion);
      updateStoredUser((currentUser) =>
        currentUser ? { ...currentUser, holidayRegion: nextRegion } : currentUser,
      );

      if (!token) {
        return;
      }

      try {
        const response = await api.updateCurrentUser({ holidayRegion: nextRegion }, token);

        if (response?.user) {
          updateStoredUser(response.user);
        }
      } catch (error) {
        setHolidayRegionState(previousRegion);
        updateStoredUser((currentUser) =>
          currentUser ? { ...currentUser, holidayRegion: previousRegion } : currentUser,
        );
        showToast(error.message || 'Failed to save holiday region.', 'error');
      }
    },
    [holidayRegion, showToast, token, updateStoredUser, user?.holidayRegion],
  );

  const value = useMemo(
    () => ({
      holidayRegion,
      holidayRegionOptions: HOLIDAY_REGION_OPTIONS,
      setHolidayRegion,
    }),
    [holidayRegion, setHolidayRegion],
  );

  return <HolidayRegionContext.Provider value={value}>{children}</HolidayRegionContext.Provider>;
};

export const useHolidayRegion = () => useContext(HolidayRegionContext);
