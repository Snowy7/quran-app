import AsyncStorage from "../storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  Coordinates,
  PrayerTimes,
  CalculationMethod,
  type CalculationParameters,
} from "adhan";

// ---- Types ----

export type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

interface ScheduledNotification {
  prayerName: PrayerName;
  identifier: string;
  time: number;
}

// ---- Constants ----

const NOTIF_ENABLED_KEY = "noor_prayer_notifications_enabled";
const NOTIF_SCHEDULED_KEY = "noor_scheduled_notifications";

const PRAYER_NAMES: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const PRAYER_ARABIC: Record<PrayerName, string> = {
  Fajr: "\u0627\u0644\u0641\u062C\u0631",
  Dhuhr: "\u0627\u0644\u0638\u0647\u0631",
  Asr: "\u0627\u0644\u0639\u0635\u0631",
  Maghrib: "\u0627\u0644\u0645\u063A\u0631\u0628",
  Isha: "\u0627\u0644\u0639\u0634\u0627\u0621",
};

type NotificationsModule = typeof import("expo-notifications");

let notificationsModule: NotificationsModule | null | undefined;

function isAndroidExpoGo(): boolean {
  return (
    Platform.OS === "android" &&
    (Constants.executionEnvironment === "storeClient" ||
      Constants.appOwnership === "expo")
  );
}

function getNotificationsModule(): NotificationsModule | null {
  if (isAndroidExpoGo()) {
    return null;
  }

  if (notificationsModule === undefined) {
    try {
      notificationsModule = require("expo-notifications") as NotificationsModule;
    } catch {
      notificationsModule = null;
    }
  }

  return notificationsModule;
}

// ---- Notification Configuration ----

export function configureNotifications(): void {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ---- Permissions ----

export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ---- Preferences ----

export async function isNotificationsEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
  return value === "true";
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, String(enabled));
  if (!enabled) {
    await cancelAllPrayerNotifications();
  }
}

// ---- Calculation Method Auto-Detection ----

function autoDetectMethod(lat: number, lng: number): CalculationParameters {
  if (lng < -30 && lat > 15) return CalculationMethod.NorthAmerica();
  if (lat > 36 && lat < 42 && lng > 26 && lng < 45)
    return CalculationMethod.Turkey();
  if (lat > 12 && lat < 35 && lng > 35 && lng < 60)
    return CalculationMethod.UmmAlQura();
  if (lat > 22 && lat < 32 && lng > 24 && lng < 37)
    return CalculationMethod.Egyptian();
  if (lat > 5 && lat < 40 && lng > 60 && lng < 95)
    return CalculationMethod.Karachi();
  if (lat > -15 && lat < 15 && lng > 95 && lng < 145)
    return CalculationMethod.Singapore();
  return CalculationMethod.MuslimWorldLeague();
}

// ---- Schedule Notifications ----

export async function schedulePrayerNotifications(
  lat: number,
  lng: number,
): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  const enabled = await isNotificationsEnabled();
  if (!enabled) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Cancel existing ones first
  await cancelAllPrayerNotifications();

  const coordinates = new Coordinates(lat, lng);
  const params = autoDetectMethod(lat, lng);
  const now = new Date();

  const scheduled: ScheduledNotification[] = [];

  // Schedule for today and tomorrow
  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);

    const pt = new PrayerTimes(coordinates, date, params);

    const prayerTimeMap: Record<PrayerName, Date> = {
      Fajr: pt.fajr,
      Dhuhr: pt.dhuhr,
      Asr: pt.asr,
      Maghrib: pt.maghrib,
      Isha: pt.isha,
    };

    for (const name of PRAYER_NAMES) {
      const time = prayerTimeMap[name];

      // Only schedule future notifications
      if (time <= now) continue;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${name} - ${PRAYER_ARABIC[name]}`,
          body: `It's time for ${name} prayer`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: time,
        },
      });

      scheduled.push({
        prayerName: name,
        identifier,
        time: time.getTime(),
      });
    }
  }

  // Save scheduled notification IDs for cleanup
  await AsyncStorage.setItem(NOTIF_SCHEDULED_KEY, JSON.stringify(scheduled));
}

// ---- Cancel Notifications ----

export async function cancelAllPrayerNotifications(): Promise<void> {
  const Notifications = getNotificationsModule();

  try {
    const raw = await AsyncStorage.getItem(NOTIF_SCHEDULED_KEY);
    if (raw) {
      const scheduled = JSON.parse(raw) as ScheduledNotification[];
      if (Notifications) {
        for (const notif of scheduled) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    }
    await AsyncStorage.removeItem(NOTIF_SCHEDULED_KEY);
  } catch {
    // If something goes wrong, cancel all notifications as fallback
    if (Notifications) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  }
}
