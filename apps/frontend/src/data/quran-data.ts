// Import bundled Quran data for offline-first access
// Data sourced from fawazahmed0/quran-api (Uthmani Hafs Arabic + Sahih International English)
import quranArabicData from "./quran-arabic.json";
import quranEnglishData from "./quran-english.json";
import quranPagesData from "./quran-pages.json";
import quranMetaData from "./quran-meta.json";

// Type definitions
interface VerseEntry {
  verse: number;
  text: string;
}

interface PageVerse {
  chapter: number;
  verse: number;
}

interface VerseMeta {
  page: number;
  juz: number;
  ruku: number;
  manzil: number;
  maqra: number;
  sajda: boolean | { no: number; recommended: boolean; obligatory: boolean };
  line: number;
}

interface ChapterMeta {
  chapter: number;
  name: string;
  englishname: string;
  arabicname: string;
  revelation: string;
  versesCount: number;
}

// ─── Text normalization ─────────────────────────────────────────────
// Uthmani text uses open tanwin marks (U+08F0, U+08F1, U+08F2) followed
// by a space + silent alef/letter. Replace the space with a zero-width
// joiner (U+200D) so the letters connect visually while preserving the
// tanwin mark positioning.
const TANWIN_SPACE_RE = /([\u08F0\u08F1\u08F2])\s/g;

function normalizeArabicText(text: string): string {
  return text.replace(TANWIN_SPACE_RE, (_match, tanwin) => tanwin + "\u200D");
}

function normalizeVerses(
  data: Record<string, VerseEntry[]>,
): Record<string, VerseEntry[]> {
  const result: Record<string, VerseEntry[]> = {};
  for (const [key, verses] of Object.entries(data)) {
    result[key] = verses.map((v) => ({
      ...v,
      text: normalizeArabicText(v.text),
    }));
  }
  return result;
}

// Cast and normalize imported data
const quranArabic = normalizeVerses(
  quranArabicData as Record<string, VerseEntry[]>,
);
const quranEnglish = quranEnglishData as Record<string, VerseEntry[]>;
const quranPages = quranPagesData as Record<string, PageVerse[]>;
const quranMeta = quranMetaData as {
  totalVerses: number;
  chapters: ChapterMeta[];
  verseMeta: Record<string, VerseMeta>;
};

// =====================================
// Arabic Text Access
// =====================================

/** Get Arabic text for a surah (1-indexed) */
export function getArabicSurah(surahId: number): VerseEntry[] {
  return quranArabic[String(surahId)] || [];
}

/** Get Arabic text for a specific verse */
export function getArabicVerse(
  surahId: number,
  verseNumber: number,
): string | undefined {
  const surah = quranArabic[String(surahId)];
  if (!surah) return undefined;
  const verse = surah.find((v) => v.verse === verseNumber);
  return verse?.text;
}

// =====================================
// English Translation Access
// =====================================

/** Get English translation for a surah (1-indexed) */
export function getEnglishSurah(surahId: number): VerseEntry[] {
  return quranEnglish[String(surahId)] || [];
}

/** Get English translation for a specific verse */
export function getEnglishVerse(
  surahId: number,
  verseNumber: number,
): string | undefined {
  const surah = quranEnglish[String(surahId)];
  if (!surah) return undefined;
  const verse = surah.find((v) => v.verse === verseNumber);
  return verse?.text;
}

// =====================================
// Page Layout Access
// =====================================

/** Get all verses for a specific page (1-604) */
export function getPageVerses(pageNumber: number): PageVerse[] {
  return quranPages[String(pageNumber)] || [];
}

/** Get the page number for a specific verse */
export function getVersePageNumber(
  surahId: number,
  verseNumber: number,
): number {
  const meta = quranMeta.verseMeta[`${surahId}:${verseNumber}`];
  return meta?.page || 1;
}

/** Get all verses on a page with their Arabic text */
export function getPageWithText(pageNumber: number): Array<{
  chapter: number;
  verse: number;
  text: string;
}> {
  const pageVerses = getPageVerses(pageNumber);
  return pageVerses.map((pv) => ({
    chapter: pv.chapter,
    verse: pv.verse,
    text: getArabicVerse(pv.chapter, pv.verse) || "",
  }));
}

/** Get page verses grouped by surah (for rendering surah headers within a page) */
export function getPageGroupedBySurah(pageNumber: number): Array<{
  surahId: number;
  surahName: string;
  surahArabicName: string;
  verses: Array<{ verse: number; text: string; translation?: string }>;
}> {
  const pageVerses = getPageVerses(pageNumber);
  const groups: Array<{
    surahId: number;
    surahName: string;
    surahArabicName: string;
    verses: Array<{ verse: number; text: string; translation?: string }>;
  }> = [];

  let currentGroup: (typeof groups)[0] | null = null;

  for (const pv of pageVerses) {
    if (!currentGroup || currentGroup.surahId !== pv.chapter) {
      const meta = quranMeta.chapters.find((c) => c.chapter === pv.chapter);
      currentGroup = {
        surahId: pv.chapter,
        surahName: meta?.englishname || `Surah ${pv.chapter}`,
        surahArabicName: meta?.arabicname || "",
        verses: [],
      };
      groups.push(currentGroup);
    }
    currentGroup.verses.push({
      verse: pv.verse,
      text: getArabicVerse(pv.chapter, pv.verse) || "",
      translation: getEnglishVerse(pv.chapter, pv.verse),
    });
  }

  return groups;
}

// =====================================
// Verse Metadata Access
// =====================================

/** Get metadata for a specific verse */
export function getVerseMeta(
  surahId: number,
  verseNumber: number,
): VerseMeta | undefined {
  return quranMeta.verseMeta[`${surahId}:${verseNumber}`];
}

/** Get chapter metadata */
export function getChapterMeta(surahId: number): ChapterMeta | undefined {
  return quranMeta.chapters.find((c) => c.chapter === surahId);
}

// =====================================
// Legacy compatible helper
// =====================================

/** Get a surah with Arabic text and English translations (compatible with old API) */
export function getOfflineSurahWithTranslation(surahId: number):
  | {
      surah: {
        id: number;
        name: string;
        transliteration: string;
        total_verses: number;
        verses: Array<{ id: number; text: string }>;
      };
      translations: Record<number, string>;
    }
  | undefined {
  const arabic = getArabicSurah(surahId);
  const english = getEnglishSurah(surahId);
  const meta = getChapterMeta(surahId);

  if (!arabic.length || !meta) return undefined;

  const translations: Record<number, string> = {};
  for (const verse of english) {
    translations[verse.verse] = verse.text;
  }

  return {
    surah: {
      id: surahId,
      name: meta.arabicname,
      transliteration: meta.englishname,
      total_verses: meta.versesCount,
      verses: arabic.map((v) => ({ id: v.verse, text: v.text })),
    },
    translations,
  };
}

// =====================================
// Constants
// =====================================

export const TOTAL_AYAHS = quranMeta.totalVerses; // 6236
export const TOTAL_SURAHS = 114;
export const TOTAL_PAGES = 604;

/** Calculate global ayah number (1-6236) from surah and ayah */
export function getGlobalAyahNumber(
  surahId: number,
  ayahNumber: number,
): number {
  let globalNumber = 0;
  for (const ch of quranMeta.chapters) {
    if (ch.chapter < surahId) {
      globalNumber += ch.versesCount;
    } else if (ch.chapter === surahId) {
      globalNumber += ayahNumber;
      break;
    }
  }
  return globalNumber;
}

// Re-export for compatibility
export { quranPages, quranMeta };
