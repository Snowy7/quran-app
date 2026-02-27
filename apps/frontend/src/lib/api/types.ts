// quran.com API v4 response types
// All field names match the API's snake_case convention

export interface TranslatedName {
  name: string;
  language_name: string;
}

export interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: TranslatedName;
}

export interface ChapterInfo {
  id: number;
  chapter_id: number;
  text: string;
  short_text: string;
  language_name: string;
  source: string;
}

export interface Word {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: 'word' | 'end' | 'pause_mark' | 'sajdah';
  code_v2: string;
  v2_page: number;
  page_number: number;
  line_number: number;
  text: string;
  translation?: { text: string; language_name: string };
  transliteration?: { text: string; language_name: string };
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  hizb_number: number;
  rub_el_hizb_number: number;
  juz_number: number;
  page_number: number;
  text_uthmani?: string;
  text_imlaei?: string;
  words?: Word[];
  translations?: Translation[];
}

export interface Translation {
  id: number;
  resource_id: number;
  text: string;
}

export interface TranslationResource {
  id: number;
  name: string;
  author_name: string;
  slug: string;
  language_name: string;
  translated_name: TranslatedName;
}

export interface TafsirResource {
  id: number;
  name: string;
  author_name: string;
  slug: string;
  language_name: string;
  translated_name: TranslatedName;
}

export interface Tafsir {
  id: number;
  resource_id: number;
  text: string;
  verse_key: string;
  language_id: number;
  resource_name: string;
}

export interface Reciter {
  id: number;
  reciter_name_simple: string;
  style: string | null;
  translated_name: TranslatedName;
}

export interface AudioFile {
  url: string;
  duration: number;
  format: string;
  chapter_id: number;
}

export interface VerseAudioFile {
  verse_key: string;
  url: string;
}

export interface PaginationMeta {
  current_page: number;
  next_page: number | null;
  per_page: number;
  total_pages: number;
  total_records: number;
}

// Response wrappers
export interface ChaptersResponse {
  chapters: Chapter[];
}

export interface ChapterInfoResponse {
  chapter_info: ChapterInfo;
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
  audio_file: AudioFile;
}

export interface VerseRecitationResponse {
  audio_files: VerseAudioFile[];
}

export interface SearchResponse {
  search: {
    query: string;
    total_results: number;
    current_page: number;
    total_pages: number;
    results: SearchResult[];
  };
}

export interface SearchResult {
  verse_key: string;
  verse_id: number;
  text: string;
  highlighted: string | null;
  translations: { text: string; resource_id: number; name: string }[];
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
