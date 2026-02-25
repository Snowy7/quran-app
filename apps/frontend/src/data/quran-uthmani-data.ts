export interface UthmaniAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface UthmaniSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  ayahs: UthmaniAyah[];
}

let cachedSurahs: UthmaniSurah[] | null = null;
let loadingPromise: Promise<UthmaniSurah[]> | null = null;

/** Load the Uthmani Quran data (fetched once, cached in memory) */
export async function loadUthmaniData(): Promise<UthmaniSurah[]> {
  if (cachedSurahs) return cachedSurahs;

  if (!loadingPromise) {
    loadingPromise = fetch('/data/quran-uthmani.json')
      .then(res => res.json())
      .then((surahs: UthmaniSurah[]) => {
        cachedSurahs = surahs;
        return surahs;
      });
  }

  return loadingPromise;
}

/** Get a surah's Uthmani text (sync — returns undefined if not loaded yet) */
export function getUthmaniSurahSync(surahId: number): UthmaniSurah | undefined {
  return cachedSurahs?.find(s => s.number === surahId);
}

/** Get all ayahs for a specific mushaf page number */
export function getUthmaniPageSync(pageNumber: number): { surahNumber: number; surahName: string; ayahs: UthmaniAyah[] }[] {
  if (!cachedSurahs) return [];

  const result: { surahNumber: number; surahName: string; ayahs: UthmaniAyah[] }[] = [];

  for (const surah of cachedSurahs) {
    const pageAyahs = surah.ayahs.filter(a => a.page === pageNumber);
    if (pageAyahs.length > 0) {
      result.push({
        surahNumber: surah.number,
        surahName: surah.name,
        ayahs: pageAyahs,
      });
    }
  }

  return result;
}

/** Get the page numbers that a surah spans */
export function getSurahPagesSync(surahId: number): number[] {
  const surah = cachedSurahs?.find(s => s.number === surahId);
  if (!surah) return [];

  const pages = new Set<number>();
  for (const ayah of surah.ayahs) {
    pages.add(ayah.page);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

/* =========================================
   Per-page QCF v2 font system
   ========================================= */

/** QCF v2 verse data (compact keys to save space) */
interface QcfVerse {
  k: string;   // verse_key e.g. "1:1"
  t: string;   // code_v2 text (PUA-encoded for per-page fonts)
  p: number;   // v2_page number
}

interface QcfChapter {
  c: number;        // chapter number
  v: QcfVerse[];    // verses
}

let cachedQcf: QcfChapter[] | null = null;
let qcfLoadingPromise: Promise<QcfChapter[]> | null = null;

/**
 * Shift code_v2 codepoints to AQF font encoding.
 * quran.com code_v2 uses U+FC41+, AQF fonts expect U+FB51+ (offset of 240).
 * The AQF font cmap has a 33-codepoint gap from U+FBB2 to U+FBD2,
 * so shifted values >= U+FBB2 must jump over the gap (+33).
 */
const AQF_CODEPOINT_OFFSET = 240;
const AQF_GAP_START = 0xFBB2;
const AQF_GAP_SIZE = 33;

function shiftToAqf(text: string): string {
  let result = '';
  for (const ch of text) {
    if (ch === ' ') {
      result += ' ';
    } else {
      let cp = ch.charCodeAt(0) - AQF_CODEPOINT_OFFSET;
      if (cp >= AQF_GAP_START) {
        cp += AQF_GAP_SIZE;
      }
      result += String.fromCharCode(cp);
    }
  }
  return result;
}

/** Load the QCF v2 font text data (fetched once, cached in memory) */
export async function loadQcfData(): Promise<QcfChapter[]> {
  if (cachedQcf) return cachedQcf;

  if (!qcfLoadingPromise) {
    qcfLoadingPromise = fetch('/data/quran-v2-font-text.json')
      .then(res => res.json())
      .then((chapters: QcfChapter[]) => {
        // Shift all text codepoints to match AQF font encoding
        for (const ch of chapters) {
          for (const v of ch.v) {
            v.t = shiftToAqf(v.t);
          }
        }
        cachedQcf = chapters;
        return chapters;
      });
  }

  return qcfLoadingPromise;
}

/** Get QCF v2 text for a specific surah (sync) */
export function getQcfSurahSync(surahId: number): QcfVerse[] | undefined {
  return cachedQcf?.find(ch => ch.c === surahId)?.v;
}

/** Get the QCF v2 text for a specific ayah (sync) */
export function getQcfAyahText(surahId: number, ayahNumber: number): string | undefined {
  const chapter = cachedQcf?.find(ch => ch.c === surahId);
  if (!chapter) return undefined;
  const verse = chapter.v.find(v => v.k === `${surahId}:${ayahNumber}`);
  return verse?.t;
}

/** Load the per-page Quran font for a specific page number */
const loadedPageFonts = new Set<number>();

export async function loadPageFont(pageNumber: number): Promise<void> {
  if (loadedPageFonts.has(pageNumber)) return;

  const paddedPage = String(pageNumber).padStart(3, '0');
  const fontName = `QCF_P${paddedPage}`;
  const fontUrl = `/fonts/quran-pages/AQF_P${paddedPage}_HA.ttf`;

  const font = new FontFace(fontName, `url(${fontUrl})`);
  try {
    const loaded = await font.load();
    document.fonts.add(loaded);
    loadedPageFonts.add(pageNumber);
  } catch (e) {
    console.warn(`Failed to load font for page ${pageNumber}:`, e);
  }
}

/** Get the CSS font-family name for a page */
export function getPageFontFamily(pageNumber: number): string {
  const paddedPage = String(pageNumber).padStart(3, '0');
  return `QCF_P${paddedPage}`;
}

/** Load the dedicated bismillah QCF font */
let bsmlFontLoaded = false;
let bsmlFontPromise: Promise<void> | null = null;

export async function loadBismillahFont(): Promise<void> {
  if (bsmlFontLoaded) return;
  if (!bsmlFontPromise) {
    bsmlFontPromise = (async () => {
      const font = new FontFace('QCF_BSML', `url(/fonts/quran-pages/AQF_BSML.ttf)`);
      try {
        const loaded = await font.load();
        document.fonts.add(loaded);
        bsmlFontLoaded = true;
      } catch (e) {
        console.warn('Failed to load bismillah font:', e);
      }
    })();
  }
  return bsmlFontPromise;
}
