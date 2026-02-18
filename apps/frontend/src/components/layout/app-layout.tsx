import { useEffect, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { BottomNav } from "./bottom-nav";
import { Sidebar, useSidebar } from "./sidebar";
import { GlobalAudioPlayer } from "@/components/audio";
import { InstallPrompt, ReloadPrompt } from "@/components/pwa";
import { initializeDatabase } from "@/lib/db";
import {
  initializeNetworkListener,
  initializePWAInstallListener,
} from "@/lib/stores/ui-store";
import { useAudioStore } from "@/lib/stores/audio-store";

// Sidebar context for global access
interface SidebarContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within AppLayout");
  }
  return context;
}

export function AppLayout() {
  const sidebar = useSidebar();
  const cleanupAudio = useAudioStore((s) => s.cleanup);

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
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return (
    <SidebarContext.Provider value={sidebar}>
      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebar.isOpen} onClose={sidebar.close} />
        <Outlet />
        <GlobalAudioPlayer />
        <BottomNav />
        <InstallPrompt />
        <ReloadPrompt />
        <Toaster
          position="bottom-center"
          toastOptions={{
            className: "mb-20",
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
              border: "1px solid hsl(var(--border))",
            },
          }}
        />
      </div>
    </SidebarContext.Provider>
  );
}
