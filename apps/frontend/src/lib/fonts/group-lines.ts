import type { Verse, Word } from '@/lib/api/types';

export interface AnnotatedWord extends Word {
  verseKey: string;
}

interface EnrichedWord extends AnnotatedWord {
  verseNumber: number;
  chapterId: number;
}

export interface MushafLineData {
  lineNumber: number;
  words: AnnotatedWord[];
  verseKeys: Set<string>;
  startsNewChapter: boolean;
  newChapterId?: number;
}

/**
 * Group all words from verses into lines, keyed by lineNumber.
 *
 * Words from the API include page_number and line_number which
 * correspond to the physical Mushaf layout.
 */
export function groupWordsByLine(verses: Verse[]): MushafLineData[] {
  const lineMap = new Map<number, MushafLineData>();

  const allWords = verses.flatMap((verse) => {
    if (!verse.words) return [];

    const chapterId = parseInt(verse.verse_key.split(':')[0], 10);

    return verse.words.map((word) => ({
      ...word,
      verseKey: verse.verse_key,
      verseNumber: verse.verse_number,
      chapterId,
    } as EnrichedWord));
  });

  const sortedWords = allWords.sort((a, b) =>
    a.line_number === b.line_number ? a.position - b.position : a.line_number - b.line_number,
  );

  for (const word of sortedWords) {
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

    const annotated: AnnotatedWord = {
      ...word,
      verseKey: word.verseKey,
    };
    lineData.words.push(annotated);
    lineData.verseKeys.add(word.verseKey);

    if (
      word.verseNumber === 1 &&
      word.position === 1 &&
      word.char_type_name === 'word' &&
      !lineData.startsNewChapter
    ) {
      lineData.startsNewChapter = true;
      lineData.newChapterId = word.chapterId;
    }
  }

  return Array.from(lineMap.values()).sort((a, b) => a.lineNumber - b.lineNumber);
}

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
