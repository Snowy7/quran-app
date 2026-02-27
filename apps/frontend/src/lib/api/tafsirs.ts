import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchApi } from "./client";
import type {
  TafsirsListResponse,
  TafsirResponse,
  TafsirsByChapterResponse,
} from "./types";

// Default tafsirs per language
// English: Ibn Kathir = 169, Arabic: Tafsir Al-Muyassar = 16
export const DEFAULT_TAFSIR_ID_EN = 169;
export const DEFAULT_TAFSIR_ID_AR = 16;

export function getDefaultTafsirId(language: string): number {
  return language === "ar" ? DEFAULT_TAFSIR_ID_AR : DEFAULT_TAFSIR_ID_EN;
}

export async function fetchAvailableTafsirs(language = "en") {
  return fetchApi<TafsirsListResponse>("/resources/tafsirs", { language });
}

export async function fetchTafsirForVerse(tafsirId: number, verseKey: string) {
  return fetchApi<TafsirResponse>(`/tafsirs/${tafsirId}/by_ayah/${verseKey}`);
}

export async function fetchTafsirByChapter(
  tafsirId: number,
  chapterId: number,
  page = 1,
) {
  return fetchApi<TafsirsByChapterResponse>(
    `/tafsirs/${tafsirId}/by_chapter/${chapterId}`,
    { page },
  );
}

export function useAvailableTafsirs(language = "en") {
  return useQuery({
    queryKey: ["tafsirs", language],
    queryFn: () => fetchAvailableTafsirs(language),
    staleTime: 1000 * 60 * 60 * 24,
    select: (data) => data.tafsirs,
  });
}

export function useTafsirForVerse(
  tafsirId: number | undefined,
  verseKey: string | undefined,
) {
  return useQuery({
    queryKey: ["tafsir", tafsirId, verseKey],
    queryFn: () => fetchTafsirForVerse(tafsirId!, verseKey!),
    enabled: !!tafsirId && !!verseKey,
    staleTime: 1000 * 60 * 60 * 24,
    select: (data) => data.tafsir,
  });
}

export function useTafsirByChapter(
  tafsirId: number | undefined,
  chapterId: number | undefined,
) {
  return useInfiniteQuery({
    queryKey: ["tafsir", "chapter", tafsirId, chapterId],
    queryFn: ({ pageParam = 1 }) =>
      fetchTafsirByChapter(tafsirId!, chapterId!, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next_page ?? undefined,
    enabled: !!tafsirId && !!chapterId,
    staleTime: 1000 * 60 * 60,
  });
}
