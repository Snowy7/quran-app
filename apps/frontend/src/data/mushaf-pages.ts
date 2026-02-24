// Mushaf page utilities - uses complete page data from quran-api
import { getVersePageNumber, TOTAL_PAGES as PAGES_COUNT } from "./quran-data";

export { PAGES_COUNT as TOTAL_PAGES };

// Get the page number for a specific surah and ayah
export function getPageForAyah(surahId: number, ayahNumber: number): number {
  return getVersePageNumber(surahId, ayahNumber);
}
