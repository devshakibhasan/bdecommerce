'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useUIStore } from '@/lib/store';
import { Palette, Moon, Sun, Monitor, Save, Check } from 'lucide-react';

const COLORS = [
  { id: 'emerald', name: 'Emerald (Default)', hex: '#059669', tailwind: 'bg-emerald-600' },
  { id: 'blue', name: 'Blue', hex: '#2563eb', tailwind: 'bg-blue-600' },
  { id: 'violet', name: 'Violet', hex: '#7c3aed', tailwind: 'bg-violet-600' },
  { id: 'rose', name: 'Rose', hex: '#e11d48', tailwind: 'bg-rose-600' },
  { id: 'orange', name: 'Orange', hex: '#f97316', tailwind: 'bg-orange-500' },
  { id: 'red', name: 'Red', hex: '#dc2626', tailwind: 'bg-red-600' },
  { id: 'zinc', name: 'Zinc (Monochrome)', hex: '#27272a', tailwind: 'bg-zinc-800' },
  { id: 'cyan', name: 'Cyan', hex: '#0891b2', tailwind: 'bg-cyan-600' },
  { id: 'amber', name: 'Amber', hex: '#d97706', tailwind: 'bg-amber-600' },
  { id: 'green', name: 'Green', hex: '#16a34a', tailwind: 'bg-green-600' },
];

export default function ThemeChangerPage() {
  const queryClient = useQueryClient();
  const [themeColor, setThemeColor] = useState('emerald');
  const themeMode = useUIStore(state => state.theme);
  const setThemeMode = useUIStore(state => state.setTheme);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res: any = await api.get('/admin/settings');
      return res?.data?.data || res?.data || {};
    }
  });

  useEffect(() => {
    if (settings) {
      if (settings.theme_color) setThemeColor(settings.theme_color);
      if (settings.theme_mode) setThemeMode(settings.theme_mode);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.put('/admin/settings', payload);
    },
    onSuccess: () => {
      toast.success('Theme settings saved!');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['global-settings'] });
      
    },
    onError: () => {
      toast.error('Failed to save theme settings');
    }
  });

  const handleSave = () => {
    saveMutation.mutate({
      theme_color: themeColor,
      theme_mode: themeMode
    });
  };

  if (isLoading) return <div className="p-12 text-center animate-pulse">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Theme Changer</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize the color and mode for the entire storefront.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> 
          <span>{saveMutation.isPending ? 'Saving...' : 'Save Theme'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="clay-card p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Palette className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Primary Brand Color</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => setThemeColor(color.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${themeColor === color.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}
              >
                <div className={`w-12 h-12 rounded-full shadow-inner flex items-center justify-center text-white ${color.tailwind}`}>
                  {themeColor === color.id && <Check className="w-5 h-5" />}
                </div>
                <span className="text-xs font-semibold text-center">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="clay-card p-6 rounded-3xl h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Monitor className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Default Theme Mode</h2>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setThemeMode('light')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${themeMode === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                <Sun className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold">Light Mode</div>
                <div className="text-xs text-muted-foreground">Force light theme for all users</div>
              </div>
              {themeMode === 'light' && <Check className="w-5 h-5 text-primary" />}
            </button>

            <button
              onClick={() => setThemeMode('dark')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${themeMode === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-100 shadow-sm">
                <Moon className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold">Dark Mode</div>
                <div className="text-xs text-muted-foreground">Force dark theme for all users</div>
              </div>
              {themeMode === 'dark' && <Check className="w-5 h-5 text-primary" />}
            </button>

            <button
              onClick={() => setThemeMode('system')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${themeMode === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-800 flex items-center justify-center text-white shadow-sm">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold">System / User Choice</div>
                <div className="text-xs text-muted-foreground">Let users toggle it or match their device</div>
              </div>
              {themeMode === 'system' && <Check className="w-5 h-5 text-primary" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
