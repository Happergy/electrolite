import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getThemePreference,
  removeThemePreference,
  saveThemePreference,
} from '../lib/priceCache';
import ThemeContext, { type Theme, type ThemeMode } from './ThemeContext';

const getSystemTheme = (): Theme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [preference, setPreference] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = preference === 'system' ? systemTheme : preference;
  const showSystemThemeButton =
    preference !== 'system' && preference !== systemTheme;

  useEffect(() => {
    let isMounted = true;

    getThemePreference()
      .then((savedPreference) => {
        if (isMounted && savedPreference) {
          setPreference(savedPreference);
        }
      })
      .catch((storageError: unknown) => {
        console.error(
          'Unable to load the saved theme preference.',
          storageError,
        );
        if (isMounted) {
          setError('No s’ha pogut carregar la preferència de tema desada.');
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

    const themeColor = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    themeColor?.setAttribute(
      'content',
      theme === 'dark' ? '#121a1c' : '#153e43',
    );
  }, [preference, theme]);

  const toggleTheme = useCallback(async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    try {
      await saveThemePreference(nextTheme);
      setPreference(nextTheme);
      setError(null);
    } catch (storageError) {
      console.error('Unable to save the theme preference.', storageError);
      setError('No s’ha pogut desar la preferència de tema.');
    }
  }, [theme]);

  const setThemeToSystem = useCallback(async () => {
    try {
      await removeThemePreference();
      setPreference('system');
      setError(null);
    } catch (storageError) {
      console.error(
        'Unable to remove the saved theme preference.',
        storageError,
      );
      setError('No s’ha pogut eliminar la preferència de tema desada.');
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      showSystemThemeButton,
      isReady,
      error,
      toggleTheme,
      setThemeToSystem,
    }),
    [
      theme,
      showSystemThemeButton,
      isReady,
      error,
      toggleTheme,
      setThemeToSystem,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
