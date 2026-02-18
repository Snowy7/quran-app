import { useState, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@template/backend";
import {
  getNotificationSettings,
  saveNotificationSettings,
  isNotificationSupported,
  isNotificationPermitted,
  requestNotificationPermission,
  schedulePrayerNotifications,
  clearScheduledNotifications,
  showNotification,
} from "@/lib/services/notifications";
import type { NotificationSettings } from "@/lib/services/notifications";

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface UsePrayerNotificationsResult {
  isSupported: boolean;
  isPermitted: boolean;
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  scheduleNotifications: (times: PrayerTimes) => void;
  testNotification: () => void;
}

export function usePrayerNotifications(
  prayerTimes: PrayerTimes | null,
): UsePrayerNotificationsResult {
  const [isPermitted, setIsPermitted] = useState(isNotificationPermitted());
  const [settings, setSettings] = useState(getNotificationSettings());

  const { isAuthenticated } = useConvexAuth();
  const saveSchedule = useMutation(api.pushQueries.saveNotificationSchedule);

  // Check permission status periodically
  useEffect(() => {
    const checkPermission = () => {
      setIsPermitted(isNotificationPermitted());
    };
    const interval = setInterval(checkPermission, 5000);
    return () => clearInterval(interval);
  }, []);

  // ─── Sync notification schedule to Convex (for server-side push) ──
  const syncToServer = useCallback(
    async (
      currentSettings: NotificationSettings,
      times: PrayerTimes | null,
    ) => {
      if (!isAuthenticated) return;

      try {
        await saveSchedule({
          enabled: currentSettings.enabled,
          prayerTimes: times || undefined,
          timezoneOffset: new Date().getTimezoneOffset(),
          atPrayerTime: currentSettings.atPrayerTime,
          beforePrayerTime: currentSettings.beforePrayerTime,
          beforeMinutes: currentSettings.beforeMinutes,
          reminderAfter: currentSettings.reminderAfter,
          reminderMinutes: currentSettings.reminderMinutes,
          dailyReadingReminder: currentSettings.dailyReadingReminder,
          dailyReadingReminderTime:
            currentSettings.dailyReadingReminderTime || "20:00",
        });
      } catch (e) {
        console.error("Failed to sync notification schedule to server:", e);
      }
    },
    [isAuthenticated, saveSchedule],
  );

  // Schedule notifications when prayer times or settings change
  useEffect(() => {
    if (prayerTimes && settings.enabled && isPermitted) {
      // Client-side fallback (always run)
      schedulePrayerNotifications(prayerTimes);
      // Server-side schedule (for signed-in users)
      syncToServer(settings, prayerTimes);
    }
  }, [prayerTimes, settings.enabled, isPermitted, syncToServer, settings]);

  // Re-schedule at midnight for next day
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 30, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      clearScheduledNotifications();
      if (prayerTimes && settings.enabled && isPermitted) {
        schedulePrayerNotifications(prayerTimes);
        syncToServer(settings, prayerTimes);
      }
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [prayerTimes, settings.enabled, isPermitted, syncToServer, settings]);

  // Re-schedule whenever the page becomes visible (user returns to app)
  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        prayerTimes &&
        settings.enabled &&
        isPermitted
      ) {
        schedulePrayerNotifications(prayerTimes);
        syncToServer(settings, prayerTimes);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [prayerTimes, settings.enabled, isPermitted, syncToServer, settings]);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setIsPermitted(granted);

    if (granted && prayerTimes && settings.enabled) {
      schedulePrayerNotifications(prayerTimes);
      syncToServer(settings, prayerTimes);
    }
    return granted;
  }, [prayerTimes, settings.enabled, syncToServer, settings]);

  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      saveNotificationSettings(newSettings);

      if (updated.enabled && isPermitted && prayerTimes) {
        schedulePrayerNotifications(prayerTimes);
        syncToServer(updated, prayerTimes);
      } else if (!updated.enabled) {
        clearScheduledNotifications();
        // Also disable on server
        syncToServer(updated, prayerTimes);
      }
    },
    [settings, isPermitted, prayerTimes, syncToServer],
  );

  const scheduleNotifications = useCallback(
    (times: PrayerTimes) => {
      if (settings.enabled && isPermitted) {
        schedulePrayerNotifications(times);
        syncToServer(settings, times);
      }
    },
    [settings.enabled, isPermitted, syncToServer, settings],
  );

  const testNotification = useCallback(() => {
    showNotification(
      "Noor — Test Notification",
      "Prayer notifications are working correctly!",
      { tag: "test-notification", url: "/settings" },
    );
  }, []);

  return {
    isSupported: isNotificationSupported(),
    isPermitted,
    settings,
    updateSettings,
    requestPermission,
    scheduleNotifications,
    testNotification,
  };
}
