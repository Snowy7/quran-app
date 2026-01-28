// Prayer Time Notification Service

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

type PrayerName = keyof PrayerTimes;

const PRAYER_NAMES: Record<PrayerName, string> = {
  Fajr: 'Fajr',
  Sunrise: 'Sunrise',
  Dhuhr: 'Dhuhr',
  Asr: 'Asr',
  Maghrib: 'Maghrib',
  Isha: 'Isha',
};

const NOTIFICATION_SETTINGS_KEY = 'prayer_notification_settings';
const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_prayer_notifications';

interface NotificationSettings {
  enabled: boolean;
  atPrayerTime: boolean;
  reminderAfter: boolean; // 20 minutes after
  reminderMinutes: number;
}

interface ScheduledNotification {
  id: string;
  prayer: PrayerName;
  type: 'at_time' | 'reminder';
  scheduledFor: number; // timestamp
  timeoutId?: number;
}

// Default settings
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  atPrayerTime: true,
  reminderAfter: true,
  reminderMinutes: 20,
};

// Active notification timeouts
let scheduledTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

// Get notification settings from localStorage
export function getNotificationSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load notification settings:', e);
  }
  return DEFAULT_SETTINGS;
}

// Save notification settings
export function saveNotificationSettings(settings: Partial<NotificationSettings>): void {
  try {
    const current = getNotificationSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save notification settings:', e);
  }
}

// Check if notifications are supported
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

// Check if notifications are permitted
export function isNotificationPermitted(): boolean {
  return isNotificationSupported() && Notification.permission === 'granted';
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.error('Failed to request notification permission:', e);
    return false;
  }
}

// Show a notification
export function showNotification(
  title: string,
  body: string,
  options?: NotificationOptions
): void {
  if (!isNotificationPermitted()) {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    // Try using service worker for better background support
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          tag: options?.tag || 'prayer-notification',
          renotify: true,
          vibrate: [200, 100, 200],
          ...options,
        });
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        tag: options?.tag || 'prayer-notification',
        ...options,
      });
    }
  } catch (e) {
    console.error('Failed to show notification:', e);
  }
}

// Parse time string (HH:MM) to Date object for today
function parseTimeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// Schedule a notification for a specific time
function scheduleNotificationAt(
  id: string,
  title: string,
  body: string,
  timestamp: number
): void {
  const now = Date.now();
  const delay = timestamp - now;

  // Don't schedule if time has passed
  if (delay <= 0) {
    return;
  }

  // Clear any existing timeout with this ID
  const existingTimeout = scheduledTimeouts.get(id);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Schedule the notification
  const timeoutId = setTimeout(() => {
    showNotification(title, body, { tag: id });
    scheduledTimeouts.delete(id);
  }, delay);

  scheduledTimeouts.set(id, timeoutId);
}

// Clear all scheduled notifications
export function clearScheduledNotifications(): void {
  scheduledTimeouts.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  scheduledTimeouts.clear();
}

// Schedule notifications for prayer times
export function schedulePrayerNotifications(times: PrayerTimes): void {
  const settings = getNotificationSettings();

  if (!settings.enabled || !isNotificationPermitted()) {
    return;
  }

  // Clear existing scheduled notifications
  clearScheduledNotifications();

  const now = Date.now();
  const prayersToNotify: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  prayersToNotify.forEach((prayer) => {
    const prayerTime = parseTimeToDate(times[prayer]);
    const prayerTimestamp = prayerTime.getTime();

    // Schedule notification at prayer time
    if (settings.atPrayerTime && prayerTimestamp > now) {
      const id = `prayer-${prayer}-at`;
      scheduleNotificationAt(
        id,
        `🕌 ${PRAYER_NAMES[prayer]} Prayer Time`,
        `It's time for ${PRAYER_NAMES[prayer]} prayer`,
        prayerTimestamp
      );
    }

    // Schedule reminder notification (20 minutes after)
    if (settings.reminderAfter) {
      const reminderTimestamp = prayerTimestamp + settings.reminderMinutes * 60 * 1000;
      if (reminderTimestamp > now) {
        const id = `prayer-${prayer}-reminder`;
        scheduleNotificationAt(
          id,
          `⏰ ${PRAYER_NAMES[prayer]} Prayer Reminder`,
          `${settings.reminderMinutes} minutes have passed since ${PRAYER_NAMES[prayer]}. Have you prayed?`,
          reminderTimestamp
        );
      }
    }
  });

  console.log(`Scheduled ${scheduledTimeouts.size} prayer notifications`);
}

// Initialize notifications (request permission and schedule)
export async function initializePrayerNotifications(times: PrayerTimes | null): Promise<boolean> {
  const settings = getNotificationSettings();

  if (!settings.enabled) {
    return false;
  }

  const permitted = await requestNotificationPermission();

  if (permitted && times) {
    schedulePrayerNotifications(times);
  }

  return permitted;
}

// Toggle notifications on/off
export async function toggleNotifications(enabled: boolean): Promise<boolean> {
  saveNotificationSettings({ enabled });

  if (enabled) {
    return await requestNotificationPermission();
  } else {
    clearScheduledNotifications();
    return true;
  }
}
