import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

function prefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyMode(mode) {
  const isDark =
    mode === 'dark' ? true :
    mode === 'light' ? false :
    prefersDark();

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  return isDark;
}

// Apply immediately on module load to avoid flash
applyMode(localStorage.getItem('theme') || 'system');

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('theme') || 'system');

  useEffect(() => {
    applyMode(mode);
    localStorage.setItem('theme', mode);

    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyMode('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const dark =
    mode === 'dark' ? true :
    mode === 'light' ? false :
    prefersDark();

  const toggle = () => setMode(dark ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ mode, dark, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
