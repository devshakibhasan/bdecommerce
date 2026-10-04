import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { CartDrawer } from '@/components/storefront/CartDrawer';
import { WhatsAppLauncher } from '@/components/storefront/WhatsAppLauncher';
import { MobileSidebar } from '@/components/storefront/MobileSidebar';
import { StorefrontBottomNavWrapper } from '@/components/storefront/StorefrontBottomNavWrapper';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div suppressHydrationWarning className="flex min-h-screen flex-col relative overflow-x-clip bg-background">
      {/* Ambient Glow Meshes — lightweight (reduced blur, no animation) */}
      <div className="fixed top-[-12%] right-[-6%] w-[580px] h-[580px] rounded-full bg-primary/15 dark:bg-primary/8 blur-[80px] pointer-events-none -z-10" />
      <div className="fixed top-[28%] left-[-12%] w-[650px] h-[650px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/6 blur-[80px] pointer-events-none -z-10" />
      <div className="fixed top-[65%] right-[-8%] w-[600px] h-[600px] rounded-full bg-rose-500/10 dark:bg-rose-500/6 blur-[80px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[10%] w-[550px] h-[550px] rounded-full bg-amber-500/10 dark:bg-amber-500/6 blur-[80px] pointer-events-none -z-10" />

     <div className="print:hidden sticky top-0 z-50">
        <Header />
      </div>

      <MobileSidebar />

      <main className="flex-1 pb-16 lg:pb-0 w-full overflow-x-hidden">{children}</main>

      <div className="print:hidden">
        <Footer />
        <CartDrawer />
        <WhatsAppLauncher />
        <StorefrontBottomNavWrapper />
      </div>
    </div>
  );
}
