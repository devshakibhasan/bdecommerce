'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataCache } from '@/lib/dataCache';
import { useUIStore } from '@/lib/store';

const THEME_COLORS: Record<string, string> = {
  emerald: '160 84% 39%',
  blue: '221.2 83.2% 53.3%',
  violet: '262.1 83.3% 57.8%',
  rose: '346.8 77.2% 49.8%',
  orange: '24.6 95% 53.1%',
  red: '0 72.2% 50.6%',
  zinc: '240 5.9% 10%',
  cyan: '189 94% 43%',
  amber: '38 92% 50%',
  green: '142.1 76.2% 36.3%',
};

export function DynamicThemeApplier() {
  const setTheme = useUIStore(state => state.setTheme);

  const { data: settings } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const res: any = await api.get('/settings');
      return res?.data?.data || res?.data || {};
    },
    initialData: () => DataCache.getInitialData('/settings') || {},
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;
    
    // Apply Primary Color
    if (settings.theme_color && THEME_COLORS[settings.theme_color]) {
      root.style.setProperty('--primary', THEME_COLORS[settings.theme_color]);
      root.style.setProperty('--ring', THEME_COLORS[settings.theme_color]);
    } else {
      // Revert to default
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
    }

    // Always maintain light mode
    setTheme('light');
  }, [settings, setTheme]);

  return null;
}
