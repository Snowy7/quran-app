import type { Verse, Word } from '@/lib/api/types';

/**
 * A word annotated with its parent verse key for audio highlighting.
 */
export interface AnnotatedWord extends Word {
  verseKey: string;
}

export interface MushafLineData {
  lineNumber: number;
  words: AnnotatedWord[];
  // Track which verse keys have words on this line (for audio highlighting)
  verseKeys: Set<string>;
  // Whether this line contains the first word of a new chapter
  startsNewChapter: boolean;
  newChapterId?: number;
}

/**
 * Group all words from verses into lines, keyed by lineNumber.
 * Follows quran.com's groupLinesByVerses pattern.
 *
 * Words from the API include page_number and line_number which
 * correspond to the physical Madani mushaf layout.
 */
export function groupWordsByLine(verses: Verse[]): MushafLineData[] {
  const lineMap = new Map<number, MushafLineData>();

  for (const verse of verses) {
    if (!verse.words) continue;

    const chapterId = parseInt(verse.verse_key.split(':')[0], 10);

    for (const word of verse.words) {
      let lineData = lineMap.get(word.line_number);

      if (!lineData) {
        lineData = {
          lineNumber: word.line_number,
          words: [],
          verseKeys: new Set(),
          startsNewChapter: false,
        };
        lineMap.set(word.line_number, lineData);
      }

      // Annotate word with its verse key
      const annotated: AnnotatedWord = {
        ...word,
        verseKey: verse.verse_key,
      };
      lineData.words.push(annotated);
      lineData.verseKeys.add(verse.verse_key);

      // Detect if this is the very first word of a new chapter
      if (
        verse.verse_number === 1 &&
        word.position === 1 &&
        !lineData.startsNewChapter
      ) {
        lineData.startsNewChapter = true;
        lineData.newChapterId = chapterId;
      }
    }
  }

  // Sort by line number
  return Array.from(lineMap.values()).sort(
    (a, b) => a.lineNumber - b.lineNumber,
  );
}

/**
 * Get the unique page numbers from a set of verses.
 */
export function getPageNumbers(verses: Verse[]): number[] {
  const pages = new Set<number>();
  for (const verse of verses) {
    if (verse.page_number) {
      pages.add(verse.page_number);
    }
    if (verse.words) {
      for (const word of verse.words) {
        pages.add(word.page_number);
      }
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}
