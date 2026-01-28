// Import bundled Quran data for offline-first access
// This data is bundled with the app and available immediately without network
import quranArabic from 'quran-cloud/dist/quran.json';
import quranEnglish from 'quran-cloud/dist/quran_en.json';

// Type definitions for the quran-cloud data structure
export interface QuranCloudVerse {
  id: number;
  text: string;
  translation?: string;
}

export interface QuranCloudSurah {
  id: number;
  name: string;
  transliteration: string;
  translation?: string;
  type: 'meccan' | 'medinan';
  total_verses: number;
  verses: QuranCloudVerse[];
}

// Cast the imported data to our types
export const QURAN_ARABIC = quranArabic as QuranCloudSurah[];
export const QURAN_ENGLISH = quranEnglish as QuranCloudSurah[];

// Helper to get a surah by ID (1-indexed)
export function getOfflineSurah(surahId: number): QuranCloudSurah | undefined {
  return QURAN_ARABIC.find(s => s.id === surahId);
}

// Helper to get a surah with English translation
export function getOfflineSurahWithTranslation(surahId: number): {
  surah: QuranCloudSurah;
  translations: Record<number, string>;
} | undefined {
  const arabicSurah = QURAN_ARABIC.find(s => s.id === surahId);
  const englishSurah = QURAN_ENGLISH.find(s => s.id === surahId);

  if (!arabicSurah) return undefined;

  const translations: Record<number, string> = {};
  if (englishSurah) {
    for (const verse of englishSurah.verses) {
      if (verse.translation) {
        translations[verse.id] = verse.translation;
      }
    }
  }

  return { surah: arabicSurah, translations };
}

// Helper to get all surahs metadata
export function getAllSurahsMetadata(): Array<{
  id: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}> {
  return QURAN_ENGLISH.map(surah => ({
    id: surah.id,
    name: surah.name,
    englishName: surah.transliteration,
    englishNameTranslation: surah.translation || '',
    numberOfAyahs: surah.total_verses,
    revelationType: surah.type === 'meccan' ? 'Meccan' : 'Medinan',
  }));
}

// Calculate global ayah number (1-6236) from surah and ayah
export function getGlobalAyahNumber(surahId: number, ayahNumber: number): number {
  let globalNumber = 0;
  for (const surah of QURAN_ARABIC) {
    if (surah.id < surahId) {
      globalNumber += surah.total_verses;
    } else if (surah.id === surahId) {
      globalNumber += ayahNumber;
      break;
    }
  }
  return globalNumber;
}

// Total number of ayahs in the Quran
export const TOTAL_AYAHS = 6236;

// Total number of surahs
export const TOTAL_SURAHS = 114;
