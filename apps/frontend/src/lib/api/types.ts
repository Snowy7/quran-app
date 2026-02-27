// quran.com API v4 response types

export interface TranslatedName {
  name: string;
  languageName: string;
}

export interface Chapter {
  id: number;
  revelationPlace: string;
  revelationOrder: number;
  bismillahPre: boolean;
  nameSimple: string;
  nameComplex: string;
  nameArabic: string;
  versesCount: number;
  pages: number[];
  translatedName: TranslatedName;
}

export interface ChapterInfo {
  id: number;
  chapterId: number;
  text: string;
  shortText: string;
  languageName: string;
  source: string;
}

export interface Word {
  id: number;
  position: number;
  audioUrl: string | null;
  charTypeName: 'word' | 'end' | 'pause_mark' | 'sajdah';
  pageNumber: number;
  lineNumber: number;
  text: string;
  textUthmani: string;
  codeV2: string;
  translation?: { text: string; languageName: string };
  transliteration?: { text: string; languageName: string };
}

export interface Verse {
  id: number;
  verseNumber: number;
  verseKey: string;
  hizbNumber: number;
  rubElHizbNumber: number;
  juzNumber: number;
  pageNumber: number;
  textUthmani: string;
  textImlaei?: string;
  words?: Word[];
  translations?: Translation[];
}

export interface Translation {
  id: number;
  resourceId: number;
  text: string;
}

export interface TranslationResource {
  id: number;
  name: string;
  authorName: string;
  slug: string;
  languageName: string;
  translatedName: TranslatedName;
}

export interface TafsirResource {
  id: number;
  name: string;
  authorName: string;
  slug: string;
  languageName: string;
  translatedName: TranslatedName;
}

export interface Tafsir {
  id: number;
  resourceId: number;
  text: string;
  verseKey: string;
  languageId: number;
  resourceName: string;
}

export interface Reciter {
  id: number;
  reciterNameSimple: string;
  style: string | null;
  translatedName: TranslatedName;
}

export interface AudioFile {
  url: string;
  duration: number;
  format: string;
  chapterId: number;
}

export interface VerseAudioFile {
  verseKey: string;
  url: string;
}

export interface PaginationMeta {
  currentPage: number;
  nextPage: number | null;
  perPage: number;
  totalPages: number;
  totalRecords: number;
}

// Response wrappers
export interface ChaptersResponse {
  chapters: Chapter[];
}

export interface ChapterInfoResponse {
  chapterInfo: ChapterInfo;
}

export interface VersesResponse {
  verses: Verse[];
  pagination: PaginationMeta;
}

export interface TranslationsListResponse {
  translations: TranslationResource[];
}

export interface TafsirsListResponse {
  tafsirs: TafsirResource[];
}

export interface TafsirResponse {
  tafsir: Tafsir;
}

export interface RecitersResponse {
  reciters: Reciter[];
}

export interface ChapterRecitationResponse {
  audioFile: AudioFile;
}

export interface VerseRecitationResponse {
  audioFiles: VerseAudioFile[];
}

export interface SearchResponse {
  search: {
    query: string;
    totalResults: number;
    currentPage: number;
    totalPages: number;
    results: SearchResult[];
  };
}

export interface SearchResult {
  verseKey: string;
  verseId: number;
  text: string;
  highlightedText: string | null;
  translations: { text: string; resourceId: number; name: string }[];
}

// Query parameter types
export interface VersesParams {
  page?: number;
  perPage?: number;
  translations?: string;
  words?: boolean;
  wordFields?: string;
  fields?: string;
  language?: string;
}
