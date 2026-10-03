'use client';

import dynamic from 'next/dynamic';

const DynamicMobileBottomNav = dynamic(
  () => import('./MobileBottomNav').then((m) => m.MobileBottomNav),
  { ssr: false }
);

export function StorefrontBottomNavWrapper() {
  return <DynamicMobileBottomNav />;
}
