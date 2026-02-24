// =====================================
// Quran Data Types
// =====================================

export interface Surah {
  id: number;
  name: string; // Arabic: الفاتحة
  englishName: string; // Al-Fatihah
  englishNameTranslation: string; // The Opening
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
  startJuz: number;
  endJuz: number;
}

export interface Ayah {
  id: number; // Unique ID (1-6236)
  surahId: number;
  numberInSurah: number;
  text: string; // Arabic text (Uthmani)
  textSimple: string; // Simplified Arabic
  juz: number;
  hizb: number;
  page: number; // Madani mushaf page
  sajdah: boolean;
  sajdahType?: "recommended" | "obligatory";
}

export interface Translation {
  ayahId: number;
  text: string;
  languageCode: string;
  translatorName: string;
  translatorId: string;
}

export interface Juz {
  id: number; // 1-30
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

// =====================================
// Audio Types
// =====================================

export interface Reciter {
  id: string;
  name: string;
  englishName: string;
  style: string; // 'Murattal', 'Mujawwad'
  audioBaseUrl: string;
}

export interface DownloadedAudio {
  id: string; // `${reciterId}_${surahId}`
  reciterId: string;
  surahId: number;
  blob: Blob;
  sizeBytes: number;
  downloadedAt: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentSurah: number | null;
  currentAyah: number | null;
  reciterId: string;
  playbackRate: number; // 0.5 - 2.0
  repeatMode: "none" | "ayah" | "surah" | "range";
  repeatCount: number;
  volume: number; // 0 - 1
}

export interface DownloadProgress {
  surahId: number;
  reciterId: string;
  totalAyahs: number;
  downloadedAyahs: number;
  status: "pending" | "downloading" | "completed" | "failed";
  error?: string;
}

// =====================================
// User Data Types
// =====================================

export interface Bookmark {
  clientId: string; // UUID generated locally
  surahId: number;
  ayahNumber: number;
  label?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean; // Soft delete for sync
  convexId?: string; // Convex _id once synced
  version: number;
  isDirty: boolean;
  pendingOperation?: "create" | "update" | "delete";
}

export interface ReadingPosition {
  surahId: number;
  ayahNumber: number;
  scrollPosition?: number;
  timestamp: number;
}

export interface ReadingProgress {
  id: string; // 'current' for single record
  lastSurahId: number;
  lastAyahNumber: number;
  lastScrollPosition?: number;
  updatedAt: number;
  totalAyahsRead: number;
  totalTimeSpentMs: number;
  currentStreak: number;
  longestStreak: number;
  lastReadDate?: number;
  version: number;
  isDirty: boolean;
}

export interface ReadingHistory {
  id: string; // Date string "YYYY-MM-DD"
  ayahsRead: Array<{
    surahId: number;
    ayahNumber: number;
    timestamp: number;
  }>;
  totalAyahs: number;
  totalTimeMs: number;
  updatedAt: number;
  version: number;
  isDirty: boolean;
}

export type MemorizationStatus =
  | "not_started"
  | "learning"
  | "memorized"
  | "needs_revision";

export interface SurahMemorization {
  surahId: number;
  status: MemorizationStatus;
  memorizedAyahs: number[];
  lastRevisedAt?: number;
  nextRevisionAt?: number;
  revisionCount: number;
  notes?: string;
  startedAt?: number;
  completedAt?: number;
  updatedAt: number;
  version: number;
  isDirty: boolean;
}

export type ThemeMode = "light" | "dark" | "system";
export type ArabicFontFamily =
  | "amiri"
  | "scheherazade"
  | "uthmani"
  | "noto-naskh"
  | "lateef"
  | "noto-nastaliq"
  | "aref-ruqaa"
  | "reem-kufi"
  | "marhey"
  | "alkalami"
  | "cairo"
  | "tajawal";
export type TextColorMode = "default" | "soft";
export type ReadingMode = "scroll" | "page";

export interface UserSettings {
  id: string; // 'current' for single record
  // Display
  theme: ThemeMode;
  arabicFontSize: number; // 18-48
  arabicFontFamily: ArabicFontFamily;
  textColorMode: TextColorMode; // 'default' | 'soft' (light grey)
  readingWidth: number; // 50-100 percentage of available width
  lineHeight: number; // 1.6-3.4 line height multiplier
  wordSpacing: number; // 0-20 in px
  letterSpacing: number; // 0-10 in px
  translationFontSize: number; // 14-24
  showTranslation: boolean;
  showTajweed: boolean;
  readingMode: ReadingMode;

  // Audio
  defaultReciterId: string;
  playbackSpeed: number;
  autoPlayNext: boolean;

  // Translation
  primaryTranslation: string;
  secondaryTranslation?: string;

  // Tafsir
  showTafsir: boolean;
  primaryTafsir: number;       // Tafsir resource ID

  // Notifications
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // "HH:mm" format
  revisionRemindersEnabled: boolean;
  streakRemindersEnabled: boolean;

  // Goals
  dailyAyahGoal: number;
  dailyTimeGoalMinutes: number;

  // Sync metadata
  lastSyncedAt: number;
  version: number;
  isDirty: boolean;
}

// =====================================
// Prayer Tracking Types
// =====================================

export type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export interface PrayerLog {
  id: string; // Date string "YYYY-MM-DD"
  prayers: {
    Fajr: { completed: boolean; completedAt?: number };
    Dhuhr: { completed: boolean; completedAt?: number };
    Asr: { completed: boolean; completedAt?: number };
    Maghrib: { completed: boolean; completedAt?: number };
    Isha: { completed: boolean; completedAt?: number };
  };
  updatedAt: number;
  version: number;
  isDirty: boolean;
}

export interface CachedPrayerTimes {
  id: string; // Date string "YYYY-MM-DD"
  times: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
  };
  location: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };
  fetchedAt: number;
}

// =====================================
// Sync Types
// =====================================

export type SyncOperation = "create" | "update" | "delete";
export type SyncEntity =
  | "settings"
  | "readingProgress"
  | "bookmark"
  | "memorization"
  | "readingHistory";

export interface SyncQueueItem {
  id: string; // UUID
  entity: SyncEntity;
  entityId: string;
  operation: SyncOperation;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  lastError?: string;
  status: "pending" | "syncing" | "failed";
}

// =====================================
// API Response Types
// =====================================

export interface QuranApiSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface QuranApiAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
}

export interface QuranApiEdition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
}

// =====================================
// Cached Data Types
// =====================================

export interface CachedSurahData {
  surahId: number;
  ayahs: Ayah[];
  fetchedAt: number;
}

export interface CachedTranslation {
  translatorId: string;
  surahId: number;
  translations: Translation[];
  fetchedAt: number;
}

// =====================================
// Tafsir Types
// =====================================

export interface TafsirEntry {
  verseKey: string;           // "1:1", "1:2", etc.
  text: string;               // HTML content
}

export interface CachedTafsir {
  tafsirId: number;
  surahId: number;
  entries: TafsirEntry[];
  fetchedAt: number;
}
