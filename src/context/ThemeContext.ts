import { createContext } from 'react';
import type { ThemePreference } from '../lib/priceCache';

export type Theme = ThemePreference;
export type ThemeMode = Theme | 'system';

type ThemeContextValue = {
  theme: Theme;
  isReady: boolean;
  error: string | null;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export default ThemeContext;
