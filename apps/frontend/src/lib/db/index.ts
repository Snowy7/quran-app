import Dexie, { type Table } from 'dexie';
import type {
  Surah,
  Ayah,
  Translation,
  Juz,
  Bookmark,
  ReadingProgress,
  ReadingHistory,
  SurahMemorization,
  UserSettings,
  SyncQueueItem,
  DownloadedAudio,
  CachedSurahData,
  CachedTranslation,
  CachedTafsir,
  Reciter,
  PrayerLog,
  CachedPrayerTimes,
} from '@/types/quran';

// =====================================
// Database Class
// =====================================

export class NoorDatabase extends Dexie {
  // Quran Data (cached from API)
  surahs!: Table<Surah, number>;
  ayahs!: Table<Ayah, number>;
  translations!: Table<Translation, [number, string]>; // [ayahId, translatorId]
  juzs!: Table<Juz, number>;
  cachedSurahData!: Table<CachedSurahData, number>;
  cachedTranslations!: Table<CachedTranslation, [string, number]>;
  cachedTafsirs!: Table<CachedTafsir, [number, number]>;

  // Audio
  reciters!: Table<Reciter, string>;
  downloadedAudio!: Table<DownloadedAudio, string>;

  // User Data
  bookmarks!: Table<Bookmark, string>;
  readingProgress!: Table<ReadingProgress, string>;
  readingHistory!: Table<ReadingHistory, string>;
  memorization!: Table<SurahMemorization, number>;
  settings!: Table<UserSettings, string>;

  // Prayer Tracking
  prayerLogs!: Table<PrayerLog, string>;
  cachedPrayerTimes!: Table<CachedPrayerTimes, string>;

  // Sync
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('NoorQuranDB');

    this.version(1).stores({
      // Quran Data - indexed for fast lookups
      surahs: 'id, revelationType',
      ayahs: 'id, surahId, [surahId+numberInSurah], juz, page',
      translations: '[ayahId+translatorId], ayahId, translatorId',
      juzs: 'id',
      cachedSurahData: 'surahId',
      cachedTranslations: '[translatorId+surahId]',

      // Audio
      reciters: 'id',
      downloadedAudio: 'id, reciterId, surahId, [reciterId+surahId]',

      // User Data
      bookmarks: 'clientId, [surahId+ayahNumber], createdAt, isDeleted, isDirty',
      readingProgress: 'id',
      readingHistory: 'id, updatedAt',
      memorization: 'surahId, status, nextRevisionAt',
      settings: 'id',

      // Sync
      syncQueue: 'id, entity, status, timestamp',
    });

    // Version 2: Add prayer tracking
    this.version(2).stores({
      // Quran Data - indexed for fast lookups
      surahs: 'id, revelationType',
      ayahs: 'id, surahId, [surahId+numberInSurah], juz, page',
      translations: '[ayahId+translatorId], ayahId, translatorId',
      juzs: 'id',
      cachedSurahData: 'surahId',
      cachedTranslations: '[translatorId+surahId]',

      // Audio
      reciters: 'id',
      downloadedAudio: 'id, reciterId, surahId, [reciterId+surahId]',

      // User Data
      bookmarks: 'clientId, [surahId+ayahNumber], createdAt, isDeleted, isDirty',
      readingProgress: 'id',
      readingHistory: 'id, updatedAt',
      memorization: 'surahId, status, nextRevisionAt',
      settings: 'id',

      // Prayer Tracking
      prayerLogs: 'id, updatedAt',
      cachedPrayerTimes: 'id',

      // Sync
      syncQueue: 'id, entity, status, timestamp',
    });

    // Version 3: Add tafsir cache
    this.version(3).stores({
      surahs: 'id, revelationType',
      ayahs: 'id, surahId, [surahId+numberInSurah], juz, page',
      translations: '[ayahId+translatorId], ayahId, translatorId',
      juzs: 'id',
      cachedSurahData: 'surahId',
      cachedTranslations: '[translatorId+surahId]',
      cachedTafsirs: '[tafsirId+surahId]',

      reciters: 'id',
      downloadedAudio: 'id, reciterId, surahId, [reciterId+surahId]',

      bookmarks: 'clientId, [surahId+ayahNumber], createdAt, isDeleted, isDirty',
      readingProgress: 'id',
      readingHistory: 'id, updatedAt',
      memorization: 'surahId, status, nextRevisionAt',
      settings: 'id',

      prayerLogs: 'id, updatedAt',
      cachedPrayerTimes: 'id',

      syncQueue: 'id, entity, status, timestamp',
    });
  }
}

// =====================================
// Database Instance
// =====================================

export const db = new NoorDatabase();

// =====================================
// Default Settings
// =====================================

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'current',
  theme: 'system',
  arabicFontSize: 28,
  arabicFontFamily: 'uthmani',
  translationFontSize: 16,
  showTranslation: true,
  showTajweed: false,
  readingMode: 'scroll',
  defaultReciterId: 'Alafasy_128kbps',
  playbackSpeed: 1.0,
  autoPlayNext: true,
  primaryTranslation: 'en.sahih',
  secondaryTranslation: undefined,
  showTafsir: false,
  primaryTafsir: 16,  // Tafsir Muyassar (Arabic, accessible)
  dailyReminderEnabled: false,
  dailyReminderTime: '06:00',
  revisionRemindersEnabled: false,
  streakRemindersEnabled: false,
  dailyAyahGoal: 10,
  dailyTimeGoalMinutes: 15,
  lastSyncedAt: 0,
  version: 1,
  isDirty: false,
};

export const DEFAULT_READING_PROGRESS: ReadingProgress = {
  id: 'current',
  lastSurahId: 1,
  lastAyahNumber: 1,
  lastScrollPosition: 0,
  updatedAt: Date.now(),
  totalAyahsRead: 0,
  totalTimeSpentMs: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastReadDate: undefined,
  version: 1,
  isDirty: false,
};

// =====================================
// Database Initialization
// =====================================

export async function initializeDatabase(): Promise<void> {
  try {
    // Ensure settings exist
    const settings = await db.settings.get('current');
    if (!settings) {
      await db.settings.put(DEFAULT_SETTINGS);
    }

    // Ensure reading progress exists
    const progress = await db.readingProgress.get('current');
    if (!progress) {
      await db.readingProgress.put(DEFAULT_READING_PROGRESS);
    }

    // Initialize default reciters if not present
    const reciterCount = await db.reciters.count();
    if (reciterCount === 0) {
      await db.reciters.bulkPut(DEFAULT_RECITERS);
    }

    console.log('[NoorDB] Database initialized successfully');
  } catch (error) {
    console.error('[NoorDB] Failed to initialize database:', error);
    throw error;
  }
}

// =====================================
// Default Reciters
// =====================================

export const DEFAULT_RECITERS: Reciter[] = [
  {
    id: 'Alafasy_128kbps',
    name: 'مشاري راشد العفاسي',
    englishName: 'Mishary Rashid Alafasy',
    style: 'Murattal',
    audioBaseUrl: 'https://everyayah.com/data/Alafasy_128kbps',
  },
  {
    id: 'Abdul_Basit_Murattal_192kbps',
    name: 'عبد الباسط عبد الصمد',
    englishName: 'Abdul Basit Abdul Samad',
    style: 'Murattal',
    audioBaseUrl: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps',
  },
  {
    id: 'Husary_128kbps',
    name: 'محمود خليل الحصري',
    englishName: 'Mahmoud Khalil Al-Husary',
    style: 'Murattal',
    audioBaseUrl: 'https://everyayah.com/data/Husary_128kbps',
  },
  {
    id: 'Minshawy_Murattal_128kbps',
    name: 'محمد صديق المنشاوي',
    englishName: 'Mohamed Siddiq El-Minshawi',
    style: 'Murattal',
    audioBaseUrl: 'https://everyayah.com/data/Minshawy_Murattal_128kbps',
  },
  {
    id: 'Saood_ash-Shuraym_128kbps',
    name: 'سعود الشريم',
    englishName: 'Saud Al-Shuraim',
    style: 'Murattal',
    audioBaseUrl: 'https://everyayah.com/data/Saood_ash-Shuraym_128kbps',
  },
];

// =====================================
// Helper Functions
// =====================================

export function generateClientId(): string {
  return crypto.randomUUID();
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
