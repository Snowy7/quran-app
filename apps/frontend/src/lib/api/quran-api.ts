import { db } from '@/lib/db';
import type { Ayah, Translation, CachedSurahData, CachedTranslation } from '@/types/quran';

const API_BASE_URL = 'https://api.quran.com/api/v4';
const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// =====================================
// Quran Text API
// =====================================

interface QuranApiResponse {
  verses: Array<{
    id: number;
    verse_key: string;
    verse_number: number;
    text_uthmani: string;
    text_imlaei: string;
    juz_number: number;
    hizb_number: number;
    page_number: number;
    sajdah_type: string | null;
  }>;
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

export async function fetchSurahAyahs(surahId: number): Promise<Ayah[]> {
  // Check cache first
  const cached = await db.cachedSurahData.get(surahId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION_MS) {
    return cached.ayahs;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/verses/by_chapter/${surahId}?language=en&words=false&per_page=300&fields=text_uthmani,text_imlaei,juz_number,hizb_number,page_number,sajdah_type`
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: QuranApiResponse = await response.json();

    const ayahs: Ayah[] = data.verses.map((verse) => ({
      id: verse.id,
      surahId,
      numberInSurah: verse.verse_number,
      text: verse.text_uthmani,
      textSimple: verse.text_imlaei,
      juz: verse.juz_number,
      hizb: verse.hizb_number,
      page: verse.page_number,
      sajdah: verse.sajdah_type !== null,
      sajdahType: verse.sajdah_type === 'recommended' ? 'recommended' :
                  verse.sajdah_type === 'obligatory' ? 'obligatory' : undefined,
    }));

    // Cache the data
    const cacheEntry: CachedSurahData = {
      surahId,
      ayahs,
      fetchedAt: Date.now(),
    };
    await db.cachedSurahData.put(cacheEntry);

    // Also store individual ayahs for quick lookup
    await db.ayahs.bulkPut(ayahs);

    return ayahs;
  } catch (error) {
    // If network fails, try to return cached data even if stale
    if (cached) {
      console.warn('[QuranAPI] Using stale cache due to network error');
      return cached.ayahs;
    }
    throw error;
  }
}

// =====================================
// Translation API
// =====================================

interface TranslationApiResponse {
  translations: Array<{
    resource_id: number;
    text: string;
  }>;
}

const TRANSLATION_IDS: Record<string, number> = {
  'en.sahih': 20, // Saheeh International
  'en.clearquran': 131, // The Clear Quran
  'en.yusufali': 22, // Yusuf Ali
  'en.pickthall': 19, // Pickthall
  'ur.ahmedali': 54, // Ahmed Ali (Urdu)
  'id.indonesian': 33, // Indonesian
  'tr.turkish': 77, // Turkish
  'fr.french': 31, // French
  'de.german': 27, // German
  'es.spanish': 83, // Spanish
};

export async function fetchTranslation(
  surahId: number,
  translatorId: string
): Promise<Translation[]> {
  const resourceId = TRANSLATION_IDS[translatorId] || 20; // Default to Saheeh International

  // Check cache first
  const cached = await db.cachedTranslations.get([translatorId, surahId]);
  if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION_MS) {
    return cached.translations;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/quran/translations/${resourceId}?chapter_number=${surahId}`
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: TranslationApiResponse = await response.json();

    // We need the ayah IDs from the cached surah data
    const surahData = await db.cachedSurahData.get(surahId);
    const ayahIds = surahData?.ayahs.map((a) => a.id) || [];

    const translations: Translation[] = data.translations.map((t, index) => ({
      ayahId: ayahIds[index] || index + 1,
      text: t.text.replace(/<sup[^>]*>.*?<\/sup>/gi, ''), // Remove footnotes
      languageCode: translatorId.split('.')[0],
      translatorName: getTranslatorName(translatorId),
      translatorId,
    }));

    // Cache the data
    const cacheEntry: CachedTranslation = {
      translatorId,
      surahId,
      translations,
      fetchedAt: Date.now(),
    };
    await db.cachedTranslations.put(cacheEntry);

    return translations;
  } catch (error) {
    // If network fails, try to return cached data even if stale
    if (cached) {
      console.warn('[QuranAPI] Using stale translation cache due to network error');
      return cached.translations;
    }
    throw error;
  }
}

function getTranslatorName(translatorId: string): string {
  const names: Record<string, string> = {
    'en.sahih': 'Saheeh International',
    'en.clearquran': 'The Clear Quran',
    'en.yusufali': 'Yusuf Ali',
    'en.pickthall': 'Pickthall',
    'ur.ahmedali': 'Ahmed Ali',
    'id.indonesian': 'Indonesian Ministry',
    'tr.turkish': 'Diyanet',
    'fr.french': 'Hamidullah',
    'de.german': 'Abu Rida',
    'es.spanish': 'Raúl González Bórnez',
  };
  return names[translatorId] || 'Unknown';
}

// =====================================
// Available Translations
// =====================================

export interface TranslatorOption {
  id: string;
  name: string;
  language: string;
  languageName: string;
}

export const AVAILABLE_TRANSLATIONS: TranslatorOption[] = [
  { id: 'en.sahih', name: 'Saheeh International', language: 'en', languageName: 'English' },
  { id: 'en.clearquran', name: 'The Clear Quran', language: 'en', languageName: 'English' },
  { id: 'en.yusufali', name: 'Yusuf Ali', language: 'en', languageName: 'English' },
  { id: 'en.pickthall', name: 'Pickthall', language: 'en', languageName: 'English' },
  { id: 'ur.ahmedali', name: 'Ahmed Ali', language: 'ur', languageName: 'Urdu' },
  { id: 'id.indonesian', name: 'Indonesian Ministry', language: 'id', languageName: 'Indonesian' },
  { id: 'tr.turkish', name: 'Diyanet', language: 'tr', languageName: 'Turkish' },
  { id: 'fr.french', name: 'Hamidullah', language: 'fr', languageName: 'French' },
  { id: 'de.german', name: 'Abu Rida', language: 'de', languageName: 'German' },
  { id: 'es.spanish', name: 'Raúl González Bórnez', language: 'es', languageName: 'Spanish' },
];

// =====================================
// Audio URL Helper
// =====================================

// Number of ayahs per surah (for calculating global ayah number)
const AYAHS_PER_SURAH = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
  110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45,
  83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55,
  78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20,
  56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

// Calculate global ayah number (1-6236) from surah and ayah number
function getGlobalAyahNumber(surahId: number, ayahNumber: number): number {
  let globalNumber = 0;
  for (let i = 0; i < surahId - 1; i++) {
    globalNumber += AYAHS_PER_SURAH[i];
  }
  return globalNumber + ayahNumber;
}

// Reciter mapping to Islamic Network CDN identifiers
const RECITER_IDENTIFIERS: Record<string, string> = {
  'Alafasy_128kbps': 'ar.alafasy',
  'Abdul_Basit_Murattal_192kbps': 'ar.abdulbasitmurattal',
  'Husary_128kbps': 'ar.husary',
  'Minshawy_Murattal_128kbps': 'ar.minshawi',
  'Saood_ash-Shuraym_128kbps': 'ar.shatri', // Using similar reciter
};

export function getAyahAudioUrl(reciterId: string, surahId: number, ayahNumber: number): string {
  // Use Islamic Network CDN which has proper CORS headers
  const reciterIdentifier = RECITER_IDENTIFIERS[reciterId] || 'ar.alafasy';
  const globalAyah = getGlobalAyahNumber(surahId, ayahNumber);
  return `https://cdn.islamic.network/quran/audio/128/${reciterIdentifier}/${globalAyah}.mp3`;
}

// Alternative: Get full surah audio URL from QuranicAudio
export function getSurahAudioUrl(reciterId: string, surahId: number): string {
  const paddedSurah = surahId.toString().padStart(3, '0');
  // QuranicAudio has full surah recordings
  const reciterMap: Record<string, string> = {
    'Alafasy_128kbps': 'mishaari_raashid_al_3afaasee',
    'Abdul_Basit_Murattal_192kbps': 'abdulbaset_mujawwad',
    'Husary_128kbps': 'mahmoud_khalil_al-husary',
    'Minshawy_Murattal_128kbps': 'muhammad_siddeeq_al-minshaawee',
    'Saood_ash-Shuraym_128kbps': 'sa3ood_al-shuraym',
  };
  const reciterPath = reciterMap[reciterId] || 'mishaari_raashid_al_3afaasee';
  return `https://download.quranicaudio.com/quran/${reciterPath}/${paddedSurah}.mp3`;
}

// =====================================
// Prefetch Surah Data
// =====================================

export async function prefetchSurah(surahId: number, translatorId: string): Promise<void> {
  await Promise.all([
    fetchSurahAyahs(surahId),
    fetchTranslation(surahId, translatorId),
  ]);
}

// =====================================
// Search Quran
// =====================================

interface SearchResult {
  surahId: number;
  ayahNumber: number;
  text: string;
  matchedText: string;
}

export async function searchQuran(query: string): Promise<SearchResult[]> {
  if (query.length < 3) return [];

  try {
    const response = await fetch(
      `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&size=20&language=en`
    );

    if (!response.ok) {
      throw new Error(`Search API request failed: ${response.status}`);
    }

    const data = await response.json();

    return data.search.results.map((result: { verse_key: string; text: string; highlighted: string }) => {
      const [surahId, ayahNumber] = result.verse_key.split(':').map(Number);
      return {
        surahId,
        ayahNumber,
        text: result.text,
        matchedText: result.highlighted || result.text,
      };
    });
  } catch (error) {
    console.error('[QuranAPI] Search failed:', error);
    return [];
  }
}
