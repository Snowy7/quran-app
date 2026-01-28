import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './bottom-nav';
import { initializeDatabase } from '@/lib/db';
import { initializeNetworkListener, initializePWAInstallListener } from '@/lib/stores/ui-store';

export function AppLayout() {
  useEffect(() => {
    // Initialize database on app load
    initializeDatabase().catch(console.error);

    // Set up network status listener
    const cleanupNetwork = initializeNetworkListener();

    // Set up PWA install prompt listener
    const cleanupPWA = initializePWAInstallListener();

    return () => {
      cleanupNetwork?.();
      cleanupPWA?.();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <BottomNav />
    </div>
  );
}
