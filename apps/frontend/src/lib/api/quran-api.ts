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

// Reciter mapping to Quran.com audio IDs
const RECITER_AUDIO_IDS: Record<string, number> = {
  'Alafasy_128kbps': 7, // Mishary Alafasy
  'Abdul_Basit_Murattal_192kbps': 1, // Abdul Basit
  'Husary_128kbps': 5, // Al-Husary
  'Minshawy_Murattal_128kbps': 9, // Al-Minshawi
  'Saood_ash-Shuraym_128kbps': 4, // As-Shuraym
};

export function getAyahAudioUrl(reciterId: string, surahId: number, ayahNumber: number): string {
  // Use Quran.com CDN which has proper CORS headers
  const audioId = RECITER_AUDIO_IDS[reciterId] || 7;
  return `https://verses.quran.com/${audioId}/${surahId}/${ayahNumber}.mp3`;
}

// Alternative: Get full surah audio URL
export function getSurahAudioUrl(reciterId: string, surahId: number): string {
  const audioId = RECITER_AUDIO_IDS[reciterId] || 7;
  const paddedSurah = surahId.toString().padStart(3, '0');
  return `https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/${paddedSurah}.mp3`;
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
