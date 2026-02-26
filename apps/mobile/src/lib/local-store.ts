import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  BookmarkEntry,
  ReaderPreferences,
  ReadingProgress,
} from "../types/quran";

const KEYS = {
  bookmarks: "noor_mobile_bookmarks",
  preferences: "noor_mobile_preferences",
  readingProgress: "noor_mobile_reading_progress",
  deviceId: "noor_mobile_device_id",
} as const;

export const defaultPreferences: ReaderPreferences = {
  showTranslation: true,
  arabicFontSize: 30,
  translationFontSize: 16,
  dailyAyahGoal: 10,
  updatedAt: Date.now(),
};

export const defaultReadingProgress: ReadingProgress = {
  lastSurahId: 1,
  lastAyahNumber: 1,
  totalAyahsRead: 0,
  updatedAt: Date.now(),
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadBookmarks(): Promise<BookmarkEntry[]> {
  return readJson<BookmarkEntry[]>(KEYS.bookmarks, []);
}

export async function saveBookmarks(bookmarks: BookmarkEntry[]): Promise<void> {
  await writeJson(KEYS.bookmarks, bookmarks);
}

export async function loadPreferences(): Promise<ReaderPreferences> {
  const loaded = await readJson<ReaderPreferences>(
    KEYS.preferences,
    defaultPreferences,
  );
  return {
    ...defaultPreferences,
    ...loaded,
  };
}

export async function savePreferences(
  preferences: ReaderPreferences,
): Promise<void> {
  await writeJson(KEYS.preferences, preferences);
}

export async function loadReadingProgress(): Promise<ReadingProgress> {
  const loaded = await readJson<ReadingProgress>(
    KEYS.readingProgress,
    defaultReadingProgress,
  );
  return {
    ...defaultReadingProgress,
    ...loaded,
  };
}

export async function saveReadingProgress(
  progress: ReadingProgress,
): Promise<void> {
  await writeJson(KEYS.readingProgress, progress);
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEYS.deviceId);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  await AsyncStorage.setItem(KEYS.deviceId, generated);
  return generated;
}

