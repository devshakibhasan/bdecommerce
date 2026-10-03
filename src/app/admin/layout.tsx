'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/lib/store';
import { Sidebar } from '@/components/admin/Sidebar';
import { api } from '@/lib/api';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user, login, hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (hasHydrated && pathname !== '/admin/login') {
      if (!isAuthenticated || !user?.is_admin) {
        router.replace('/admin/login');
      } else {
        // Fetch fresh user data to ensure roles are up-to-date (e.g. if granted via DB directly)
        api.auth.getMe().then((res: any) => {
          if (res?.data && (JSON.stringify(res.data.roles) !== JSON.stringify(user?.roles) || res.data.is_admin !== user?.is_admin)) {
            useAuthStore.getState().setUser(res.data);
          }
        }).catch(() => {});
      }
    }
  }, [isAuthenticated, user?.is_admin, hasHydrated, pathname, router]);

  if (!mounted || !hasHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0d1117] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase">Loading Admin Portal...</p>
      </div>
    );
  }

  // If explicitly on /admin/login, render login page
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">{children}</div>;
  }

  // If unauthenticated or not an admin, protect the portal
  if (!isAuthenticated || !user?.is_admin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0d1117] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase">Redirecting to Admin Login...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0d1117] text-slate-900 dark:text-slate-100 print:bg-white print:block">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 md:p-8 pt-16 md:pt-8 min-w-0 print:p-0 print:m-0 print:overflow-visible print:w-full">
        <div className="max-w-7xl mx-auto print:max-w-none print:w-full print:p-0 print:m-0">
          {children}
        </div>
      </main>
    </div>
  );
}
