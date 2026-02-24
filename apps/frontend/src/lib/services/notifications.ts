// ─── Prayer & Reading Notification Service ──────────────────────────
// Persists scheduled notifications and sends them to the service worker
// so they fire even when the app tab is closed (PWA installed).

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

const PRAYER_DISPLAY: Record<PrayerName, string> = {
  Fajr: "Fajr",
  Dhuhr: "Dhuhr",
  Asr: "Asr",
  Maghrib: "Maghrib",
  Isha: "Isha",
};

const NOTIFICATION_SETTINGS_KEY = "prayer_notification_settings";

export interface NotificationSettings {
  enabled: boolean;
  atPrayerTime: boolean;
  beforePrayerTime: boolean;
  beforeMinutes: number;
  reminderAfter: boolean;
  reminderMinutes: number;
  dailyReadingReminder: boolean;
  dailyReadingReminderTime: string; // "HH:MM"
}

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  tag: string;
  url?: string;
  fired?: boolean;
}

// Default settings
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  atPrayerTime: true,
  beforePrayerTime: false,
  beforeMinutes: 15,
  reminderAfter: true,
  reminderMinutes: 20,
  dailyReadingReminder: false,
  dailyReadingReminderTime: "20:00",
};

// ─── Settings persistence ───────────────────────────────────────────

export function getNotificationSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load notification settings:", e);
  }
  return DEFAULT_SETTINGS;
}

export function saveNotificationSettings(
  settings: Partial<NotificationSettings>,
): void {
  try {
    const current = getNotificationSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save notification settings:", e);
  }
}

// ─── Permission helpers ─────────────────────────────────────────────

export function isNotificationSupported(): boolean {
  return "Notification" in window;
}

export function isNotificationPermitted(): boolean {
  return isNotificationSupported() && Notification.permission === "granted";
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch {
    return false;
  }
}

// ─── Show a notification (immediate) ────────────────────────────────

export function showNotification(
  title: string,
  body: string,
  options?: NotificationOptions & { url?: string },
): void {
  if (!isNotificationPermitted()) return;

  try {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-96x96.png",
          tag: options?.tag || "noor-notification",
          data: { url: options?.url || "/" },
          requireInteraction: false,
          ...options,
        } as NotificationOptions);
      });
    } else {
      new Notification(title, {
        body,
        icon: "/icons/icon-192x192.png",
        tag: options?.tag || "noor-notification",
        ...options,
      });
    }
  } catch (e) {
    console.error("Failed to show notification:", e);
  }
}

// ─── Time parsing helpers ───────────────────────────────────────────

function parseTimeToTimestamp(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
}

// ─── Send schedule to service worker ────────────────────────────────

async function sendToServiceWorker(
  notifications: ScheduledNotification[],
): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;

    // Try periodic sync for background wakeup (Chrome Android)
    if ("periodicSync" in registration) {
      try {
        await (registration as any).periodicSync.register(
          "check-prayer-notifications",
          { minInterval: 60 * 1000 }, // 1 minute
        );
      } catch {
        // periodicSync may be denied — that's fine, we fall back to in-page checks
      }
    }

    // Send the schedule to the SW
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SCHEDULE_NOTIFICATIONS",
        notifications,
      });
    }
  } catch (e) {
    console.error("Failed to send notifications to SW:", e);
  }
}

async function clearServiceWorkerNotifications(): Promise<void> {
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller)
    return;

  navigator.serviceWorker.controller.postMessage({
    type: "CLEAR_NOTIFICATIONS",
  });
}

// ─── In-page fallback (setTimeout for when SW approach isn't enough) ─

let fallbackTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

function clearFallbackTimeouts(): void {
  fallbackTimeouts.forEach((id) => clearTimeout(id));
  fallbackTimeouts.clear();
}

function scheduleFallback(notif: ScheduledNotification): void {
  const delay = notif.timestamp - Date.now();
  if (delay <= 0) return;

  const existing = fallbackTimeouts.get(notif.id);
  if (existing) clearTimeout(existing);

  const timeoutId = setTimeout(() => {
    showNotification(notif.title, notif.body, {
      tag: notif.tag,
      url: notif.url,
    });
    fallbackTimeouts.delete(notif.id);
  }, delay);

  fallbackTimeouts.set(notif.id, timeoutId);
}

// ─── Main scheduling function ───────────────────────────────────────

export function schedulePrayerNotifications(times: PrayerTimes): void {
  const settings = getNotificationSettings();
  if (!settings.enabled || !isNotificationPermitted()) return;

  // Clear previous
  clearFallbackTimeouts();

  const now = Date.now();
  const scheduled: ScheduledNotification[] = [];
  const prayers: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

  for (const prayer of prayers) {
    const prayerTs = parseTimeToTimestamp(times[prayer]);

    // Before prayer time reminder
    if (settings.beforePrayerTime && settings.beforeMinutes > 0) {
      const beforeTs = prayerTs - settings.beforeMinutes * 60_000;
      if (beforeTs > now) {
        scheduled.push({
          id: `prayer-${prayer}-before`,
          title: `${PRAYER_DISPLAY[prayer]} in ${settings.beforeMinutes} min`,
          body: `${PRAYER_DISPLAY[prayer]} prayer is coming up soon`,
          timestamp: beforeTs,
          tag: `prayer-${prayer}-before`,
          url: "/prayer-times",
        });
      }
    }

    // At prayer time
    if (settings.atPrayerTime && prayerTs > now) {
      scheduled.push({
        id: `prayer-${prayer}-at`,
        title: `${PRAYER_DISPLAY[prayer]} Prayer Time`,
        body: `It's time for ${PRAYER_DISPLAY[prayer]} prayer`,
        timestamp: prayerTs,
        tag: `prayer-${prayer}-at`,
        url: "/prayer-times",
      });
    }

    // Reminder after prayer time
    if (settings.reminderAfter && settings.reminderMinutes > 0) {
      const afterTs = prayerTs + settings.reminderMinutes * 60_000;
      if (afterTs > now) {
        scheduled.push({
          id: `prayer-${prayer}-reminder`,
          title: `${PRAYER_DISPLAY[prayer]} Prayer Reminder`,
          body: `${settings.reminderMinutes} minutes since ${PRAYER_DISPLAY[prayer]}. Have you prayed?`,
          timestamp: afterTs,
          tag: `prayer-${prayer}-reminder`,
          url: "/prayer-times",
        });
      }
    }
  }

  // Daily reading reminder
  if (settings.dailyReadingReminder && settings.dailyReadingReminderTime) {
    const readingTs = parseTimeToTimestamp(settings.dailyReadingReminderTime);
    if (readingTs > now) {
      scheduled.push({
        id: "daily-reading-reminder",
        title: "Daily Quran Reminder",
        body: "Take a moment to read Quran today",
        timestamp: readingTs,
        tag: "daily-reading-reminder",
        url: "/quran",
      });
    }
  }

  // Send to service worker for background delivery
  sendToServiceWorker(scheduled);

  // Also set fallback timeouts for in-page delivery
  for (const notif of scheduled) {
    scheduleFallback(notif);
  }

  console.log(`Scheduled ${scheduled.length} notifications (SW + fallback)`);
}

// ─── Clear everything ───────────────────────────────────────────────

export function clearScheduledNotifications(): void {
  clearFallbackTimeouts();
  clearServiceWorkerNotifications();
}

// ─── Initialize ─────────────────────────────────────────────────────

export async function initializePrayerNotifications(
  times: PrayerTimes | null,
): Promise<boolean> {
  const settings = getNotificationSettings();
  if (!settings.enabled) return false;

  const permitted = await requestNotificationPermission();
  if (permitted && times) {
    schedulePrayerNotifications(times);
  }
  return permitted;
}

export async function toggleNotifications(enabled: boolean): Promise<boolean> {
  saveNotificationSettings({ enabled });
  if (enabled) {
    return await requestNotificationPermission();
  } else {
    clearScheduledNotifications();
    return true;
  }
}
