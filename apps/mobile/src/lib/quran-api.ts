import type { Ayah, SurahSummary, TafsirEntry } from "../types/quran";

const API_BASE_URL = "https://api.quran.com/api/v4";
const REQUEST_TIMEOUT_MS = 15000;

interface ChaptersResponse {
  chapters: Array<{
    id: number;
    name_arabic: string;
    name_simple: string;
    translated_name: {
      name: string;
    };
    verses_count: number;
    revelation_place: string;
  }>;
}

interface VersesByChapterResponse {
  verses: Array<{
    id: number;
    verse_key: string;
    verse_number: number;
    page_number: number;
    text_uthmani: string;
    translations?: Array<{
      text: string;
    }>;
  }>;
}

interface VerseByKeyResponse {
  verse: {
    id: number;
    verse_key: string;
    verse_number: number;
    page_number: number;
    text_uthmani: string;
    translations?: Array<{
      text: string;
    }>;
  };
}

interface TafsirByChapterResponse {
  tafsirs: Array<{
    verse_key: string;
    text: string;
  }>;
}

export interface TafsirOption {
  id: number;
  name: string;
  language: "ar" | "en";
}

export const AVAILABLE_TAFSIRS: TafsirOption[] = [
  { id: 16, name: "Tafsir Muyassar", language: "ar" },
  { id: 91, name: "Tafsir As-Sa'di", language: "ar" },
  { id: 14, name: "Tafsir Ibn Kathir", language: "ar" },
  { id: 169, name: "Ibn Kathir (English)", language: "en" },
];

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, "").trim();
}

async function requestJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Quran API request failed (${response.status})`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchChapters(): Promise<SurahSummary[]> {
  const data = await requestJson<ChaptersResponse>("/chapters?language=en");

  return data.chapters.map((chapter) => ({
    id: chapter.id,
    nameArabic: chapter.name_arabic,
    nameSimple: chapter.name_simple,
    translatedName: chapter.translated_name.name,
    versesCount: chapter.verses_count,
    revelationPlace: chapter.revelation_place,
  }));
}

export async function fetchChapterVerses(
  surahId: number,
  translationResourceId = 20,
): Promise<Ayah[]> {
  const data = await requestJson<VersesByChapterResponse>(
    `/verses/by_chapter/${surahId}?language=en&words=false&per_page=300&translations=${translationResourceId}&fields=text_uthmani,verse_key,page_number`,
  );

  return data.verses.map((verse) => ({
    id: verse.id,
    verseKey: verse.verse_key,
    ayahNumber: verse.verse_number,
    pageNumber: verse.page_number,
    textUthmani: verse.text_uthmani,
    translationText: stripHtml(verse.translations?.[0]?.text ?? ""),
  }));
}

export async function fetchFeaturedVerse(): Promise<Ayah> {
  const data = await requestJson<VerseByKeyResponse>(
    "/verses/by_key/36:58?language=en&words=false&translations=20&fields=text_uthmani,verse_key",
  );
  const verse = data.verse;

  return {
    id: verse.id,
    verseKey: verse.verse_key,
    ayahNumber: verse.verse_number,
    pageNumber: verse.page_number,
    textUthmani: verse.text_uthmani,
    translationText: stripHtml(verse.translations?.[0]?.text ?? ""),
  };
}

export async function fetchTafsir(
  surahId: number,
  tafsirId = 16,
): Promise<TafsirEntry[]> {
  const data = await requestJson<TafsirByChapterResponse>(
    `/tafsirs/${tafsirId}/by_chapter/${surahId}?per_page=300`,
  );

  return data.tafsirs.map((entry) => ({
    verseKey: entry.verse_key,
    text: stripHtml(entry.text),
  }));
}

const RECITERS: Record<string, { everyAyah: string; quranCdn: number | null }> = {
  Abdul_Basit_Murattal_192kbps: {
    everyAyah: "Abdul_Basit_Murattal_192kbps",
    quranCdn: 1,
  },
  Minshawy_Murattal_128kbps: {
    everyAyah: "Minshawy_Murattal_128kbps",
    quranCdn: 9,
  },
  Husary_128kbps: {
    everyAyah: "Husary_128kbps",
    quranCdn: 6,
  },
  Alafasy_128kbps: {
    everyAyah: "Alafasy_128kbps",
    quranCdn: 7,
  },
};

const DEFAULT_RECITER = "Abdul_Basit_Murattal_192kbps";

export function getAyahAudioUrl(
  reciterId: string,
  surahId: number,
  ayahNumber: number,
): string {
  const resolvedReciter = RECITERS[reciterId]?.everyAyah ?? DEFAULT_RECITER;
  const paddedSurah = surahId.toString().padStart(3, "0");
  const paddedAyah = ayahNumber.toString().padStart(3, "0");
  return `https://everyayah.com/data/${resolvedReciter}/${paddedSurah}${paddedAyah}.mp3`;
}

export function getAyahAudioUrlFallback(
  reciterId: string,
  surahId: number,
  ayahNumber: number,
): string | null {
  const defaultQuranCdn = RECITERS[DEFAULT_RECITER]?.quranCdn ?? 1;
  const quranCdn = RECITERS[reciterId]?.quranCdn ?? defaultQuranCdn;
  if (quranCdn === null) return null;
  return `https://audio.qurancdn.com/${quranCdn}/${surahId}/${ayahNumber}.mp3`;
}

export function getAyahAudioUrls(
  reciterId: string,
  surahId: number,
  ayahNumber: number,
): string[] {
  const urls = [getAyahAudioUrl(reciterId, surahId, ayahNumber)];
  const fallback = getAyahAudioUrlFallback(reciterId, surahId, ayahNumber);
  if (fallback) urls.push(fallback);
  return urls;
}
