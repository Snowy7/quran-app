import { useState, useEffect, useCallback } from 'react';
import {
  getNotificationSettings,
  saveNotificationSettings,
  isNotificationSupported,
  isNotificationPermitted,
  requestNotificationPermission,
  schedulePrayerNotifications,
  clearScheduledNotifications,
  showNotification,
} from '@/lib/services/notifications';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface NotificationSettings {
  enabled: boolean;
  atPrayerTime: boolean;
  reminderAfter: boolean;
  reminderMinutes: number;
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

export function usePrayerNotifications(prayerTimes: PrayerTimes | null): UsePrayerNotificationsResult {
  const [isPermitted, setIsPermitted] = useState(isNotificationPermitted());
  const [settings, setSettings] = useState(getNotificationSettings());

  // Check permission status on mount and when it might change
  useEffect(() => {
    const checkPermission = () => {
      setIsPermitted(isNotificationPermitted());
    };

    // Check periodically in case permission changes
    const interval = setInterval(checkPermission, 5000);

    return () => clearInterval(interval);
  }, []);

  // Schedule notifications when prayer times change
  useEffect(() => {
    if (prayerTimes && settings.enabled && isPermitted) {
      schedulePrayerNotifications(prayerTimes);
    }

    return () => {
      // Don't clear on unmount - we want notifications to persist
    };
  }, [prayerTimes, settings.enabled, isPermitted]);

  // Re-schedule at midnight for next day
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 10, 0); // 10 seconds after midnight

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      if (prayerTimes && settings.enabled && isPermitted) {
        // Will need to refetch prayer times for new day
        // For now, just clear scheduled notifications
        clearScheduledNotifications();
      }
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [prayerTimes, settings.enabled, isPermitted]);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setIsPermitted(granted);

    if (granted && prayerTimes && settings.enabled) {
      schedulePrayerNotifications(prayerTimes);
    }

    return granted;
  }, [prayerTimes, settings.enabled]);

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveNotificationSettings(newSettings);

    if (updated.enabled && isPermitted && prayerTimes) {
      schedulePrayerNotifications(prayerTimes);
    } else if (!updated.enabled) {
      clearScheduledNotifications();
    }
  }, [settings, isPermitted, prayerTimes]);

  const scheduleNotifications = useCallback((times: PrayerTimes) => {
    if (settings.enabled && isPermitted) {
      schedulePrayerNotifications(times);
    }
  }, [settings.enabled, isPermitted]);

  const testNotification = useCallback(() => {
    showNotification(
      '🕌 Test Notification',
      'Prayer notifications are working correctly!',
      { tag: 'test-notification' }
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
