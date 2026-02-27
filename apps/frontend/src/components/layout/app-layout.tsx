import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { BottomNav } from './bottom-nav';
import { InstallPrompt, ReloadPrompt } from '@/components/pwa';
import { initializeDatabase } from '@/lib/db';
import { initializeNetworkListener, initializePWAInstallListener } from '@/lib/stores/ui-store';

export function AppLayout() {
  useEffect(() => {
    initializeDatabase().catch(console.error);
    const cleanupNetwork = initializeNetworkListener();
    const cleanupPWA = initializePWAInstallListener();

    return () => {
      cleanupNetwork?.();
      cleanupPWA?.();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-3xl pb-24">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <InstallPrompt />
      <ReloadPrompt />
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: 'mb-20 lg:mb-4',
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </div>
  );
}
