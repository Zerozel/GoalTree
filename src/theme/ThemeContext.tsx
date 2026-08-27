'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    bg: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
  };
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    primaryDark: '#1D4ED8',
    secondary: '#0891B2',
    accent: '#7C3AED',
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    border: '#E2E8F0',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    primaryDark: '#60A5FA',
    secondary: '#22D3EE',
    accent: '#A78BFA',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    bg: '#0F172A',
    surface: '#1E293B',
    surfaceAlt: '#334155',
    border: '#334155',
    textPrimary: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    textInverse: '#0F172A',
  },
};

const MODE_KEY = 'goaltree:theme';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const effectiveDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const theme = effectiveDark ? darkTheme : lightTheme;

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(MODE_KEY, m);
  }, []);

  const toggle = useCallback(() => {
    setMode(effectiveDark ? 'light' : 'dark');
  }, [effectiveDark, setMode]);

  const value: ThemeContextValue = { theme, mode, setMode, toggle };

  if (!loaded) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
