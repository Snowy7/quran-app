// Mushaf page boundaries based on Madani Mushaf
// Each entry: [surahId, startAyah, endAyah]
// This is a simplified version covering the first few surahs and some popular ones

export interface MushafPage {
  pageNumber: number;
  surahId: number;
  startAyah: number;
  endAyah: number;
}

// Page data for the 15-line Madani Mushaf
// Format: pageNumber -> array of {surahId, startAyah, endAyah}
export const MUSHAF_PAGES: Record<number, MushafPage[]> = {
  1: [{ pageNumber: 1, surahId: 1, startAyah: 1, endAyah: 7 }],
  2: [{ pageNumber: 2, surahId: 2, startAyah: 1, endAyah: 5 }],
  3: [{ pageNumber: 3, surahId: 2, startAyah: 6, endAyah: 16 }],
  4: [{ pageNumber: 4, surahId: 2, startAyah: 17, endAyah: 24 }],
  5: [{ pageNumber: 5, surahId: 2, startAyah: 25, endAyah: 29 }],
  6: [{ pageNumber: 6, surahId: 2, startAyah: 30, endAyah: 37 }],
  7: [{ pageNumber: 7, surahId: 2, startAyah: 38, endAyah: 48 }],
  8: [{ pageNumber: 8, surahId: 2, startAyah: 49, endAyah: 57 }],
  9: [{ pageNumber: 9, surahId: 2, startAyah: 58, endAyah: 61 }],
  10: [{ pageNumber: 10, surahId: 2, startAyah: 62, endAyah: 69 }],
};

// Surah to page mapping (first page of each surah)
export const SURAH_START_PAGES: Record<number, number> = {
  1: 1,    // Al-Fatihah
  2: 2,    // Al-Baqarah
  3: 50,   // Aal-Imran
  4: 77,   // An-Nisa
  5: 106,  // Al-Ma'idah
  6: 128,  // Al-An'am
  7: 151,  // Al-A'raf
  8: 177,  // Al-Anfal
  9: 187,  // At-Tawbah
  10: 208, // Yunus
  // Short surahs at the end (Juz 30)
  78: 582, // An-Naba
  87: 591, // Al-A'la
  93: 596, // Ad-Duha
  94: 596, // Ash-Sharh
  95: 597, // At-Tin
  96: 597, // Al-Alaq
  97: 598, // Al-Qadr
  98: 598, // Al-Bayyinah
  99: 599, // Az-Zalzalah
  100: 599, // Al-Adiyat
  101: 600, // Al-Qari'ah
  102: 600, // At-Takathur
  103: 601, // Al-Asr
  104: 601, // Al-Humazah
  105: 601, // Al-Fil
  106: 602, // Quraysh
  107: 602, // Al-Ma'un
  108: 602, // Al-Kawthar
  109: 603, // Al-Kafirun
  110: 603, // An-Nasr
  111: 603, // Al-Masad
  112: 604, // Al-Ikhlas
  113: 604, // Al-Falaq
  114: 604, // An-Nas
};

// Get the page number for a specific surah and ayah
export function getPageForAyah(surahId: number, ayahNumber: number): number {
  // For simplicity, return the surah's start page
  // A full implementation would have complete page boundary data
  return SURAH_START_PAGES[surahId] || 1;
}

// Total pages in the Mushaf
export const TOTAL_PAGES = 604;
