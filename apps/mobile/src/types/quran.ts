export interface SurahSummary {
  id: number;
  nameArabic: string;
  nameSimple: string;
  translatedName: string;
  versesCount: number;
  revelationPlace: "makkah" | "madinah" | string;
}

export interface Ayah {
  id: number;
  verseKey: string;
  ayahNumber: number;
  pageNumber: number;
  textUthmani: string;
  translationText: string;
}

export interface TafsirEntry {
  verseKey: string;
  text: string;
}

export interface BookmarkEntry {
  surahId: number;
  surahName: string;
  ayahNumber: number;
  ayahText?: string;
  note?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReaderPreferences {
  showTranslation: boolean;
  arabicFontSize: number;
  translationFontSize: number;
  dailyAyahGoal: number;
  updatedAt: number;
}

export interface ReadingProgress {
  lastSurahId: number;
  lastAyahNumber: number;
  totalAyahsRead: number;
  updatedAt: number;
}

export type SyncStatus = "idle" | "syncing" | "success" | "error" | "disabled";
