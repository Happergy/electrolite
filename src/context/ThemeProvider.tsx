import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import ThemeContext, { type Theme, type ThemeMode } from './ThemeContext';
import { getThemePreference, saveThemePreference } from '../lib/priceCache';

const getSystemTheme = (): Theme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [preference, setPreference] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    let isMounted = true;

    getThemePreference()
      .then((savedPreference) => {
        if (isMounted && savedPreference) {
          setPreference(savedPreference);
        }
      })
      .catch((storageError: unknown) => {
        console.error('Unable to load the saved theme preference.', storageError);
        if (isMounted) {
          setError('No se pudo cargar la preferencia de tema guardada.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', updateSystemTheme);
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (preference === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.dataset.theme = preference;
    }

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute('content', theme === 'dark' ? '#121a1c' : '#153e43');
  }, [preference, theme]);

  const toggleTheme = useCallback(async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    try {
      await saveThemePreference(nextTheme);
      setPreference(nextTheme);
      setError(null);
    } catch (storageError) {
      console.error('Unable to save the theme preference.', storageError);
      setError('No se pudo guardar la preferencia de tema.');
    }
  }, [theme]);

  const value = useMemo(
    () => ({ theme, isReady, error, toggleTheme }),
    [theme, isReady, error, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
