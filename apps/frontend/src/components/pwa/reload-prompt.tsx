import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // 60 minutes

/**
 * Handles PWA service worker updates.
 *
 * When a new version of the app is available, shows a toast prompting the
 * user to reload. Also periodically checks for updates every 60 minutes.
 */
export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        setInterval(() => {
          registration.update();
        }, UPDATE_CHECK_INTERVAL);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast("Update available", {
        description: "A new version of Noor is ready.",
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: () => updateServiceWorker(true),
        },
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
