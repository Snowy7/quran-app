import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { BottomNav } from "./bottom-nav";
import { AudioPlayer } from "@/components/audio/audio-player";
import { InstallPrompt, ReloadPrompt } from "@/components/pwa";
import { initializeDatabase } from "@/lib/db";
import {
  initializeNetworkListener,
  initializePWAInstallListener,
} from "@/lib/stores/ui-store";
import {
  useContentWidth,
  getContentMaxWidth,
  getContentFontScale,
} from "@/lib/hooks/use-settings";

export function AppLayout() {
  const contentWidth = useContentWidth();
  const maxWidth = getContentMaxWidth(contentWidth);
  const fontScale = getContentFontScale(contentWidth);

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
        <div
          className="mx-auto pb-20 px-0 sm:px-4"
          style={
            {
              maxWidth,
              "--content-font-scale": fontScale,
            } as React.CSSProperties
          }
        >
          <Outlet />
        </div>
      </main>
      <AudioPlayer />
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
            borderRadius: "1rem",
          },
        }}
      />
    </div>
  );
}
