'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { DynamicThemeApplier } from '@/components/theme/DynamicThemeApplier';

function ThemeInitializer() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ui-storage');
      let theme = null;
      if (stored) {
        const parsed = JSON.parse(stored);
        theme = parsed?.state?.theme;
      }
      if (!theme) {
        theme = localStorage.getItem('theme');
      }
      if (theme === 'dark' || (!theme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (e) {}
  }, []);

  return null;
}

function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (!sessionStorage.getItem('rq_cache_busted_v5')) {
          localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
          sessionStorage.setItem('rq_cache_busted_v5', 'true');
        }
        ['sessionStorage', 'localStorage'].forEach((storeName) => {
          const store = (window as any)[storeName];
          if (!store) return;
          const toRemove: string[] = [];
          for (let i = 0; i < store.length; i++) {
            const k = store.key(i);
            if (k && k.startsWith('bd_data_cache_') && !k.startsWith('bd_data_cache_v5_')) {
              toRemove.push(k);
            }
          }
          toRemove.forEach((k) => store.removeItem(k));
        });
      } catch (e) {}
    }

    // Force purge all browser CacheStorage items
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      }).catch(() => {});
    }

    // Force unregister all active service workers to eliminate stale chunk interception
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      }).catch(() => {});
    }
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes cache validity
            gcTime: 24 * 60 * 60 * 1000, // 24 hours garbage collection (for persistence)
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      })
  );

  const [persister] = useState(() => 
    createSyncStoragePersister({
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    })
  );

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <ThemeInitializer />
      <DynamicThemeApplier />
      <ServiceWorkerRegistrar />
      {children}
      <Toaster position="top-center" />
    </PersistQueryClientProvider>
  );
}
