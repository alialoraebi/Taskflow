import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const FONT_SIZE_STORAGE_KEY = 'taskflow:font-size';
const FONT_SIZE_SCALE = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

const FontSizeContext = createContext({
  fontSize: 'medium',
  setFontSize: () => {},
});

const getInitialFontSize = () => {
  if (typeof window === 'undefined') {
    return 'medium';
  }

  const storedFontSize = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY);
  return storedFontSize && FONT_SIZE_SCALE[storedFontSize] ? storedFontSize : 'medium';
};

export const FontSizeProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState(getInitialFontSize);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize);
    }

    document.documentElement.style.fontSize = FONT_SIZE_SCALE[fontSize] || FONT_SIZE_SCALE.medium;
  }, [fontSize]);

  const value = useMemo(
    () => ({
      fontSize,
      setFontSize,
    }),
    [fontSize],
  );

  return <FontSizeContext.Provider value={value}>{children}</FontSizeContext.Provider>;
};

export const useFontSize = () => useContext(FontSizeContext);
