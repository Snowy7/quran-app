import { useQuery } from '@tanstack/react-query';
import { fetchApi } from './client';
import type { TafsirsListResponse, TafsirResponse } from './types';

export async function fetchAvailableTafsirs(language = 'en') {
  return fetchApi<TafsirsListResponse>('/resources/tafsirs', { language });
}

export async function fetchTafsirForVerse(tafsirId: number, verseKey: string) {
  return fetchApi<TafsirResponse>(`/tafsirs/${tafsirId}/by_ayah/${verseKey}`);
}

export function useAvailableTafsirs(language = 'en') {
  return useQuery({
    queryKey: ['tafsirs', language],
    queryFn: () => fetchAvailableTafsirs(language),
    staleTime: 1000 * 60 * 60 * 24,
    select: (data) => data.tafsirs,
  });
}

export function useTafsirForVerse(tafsirId: number | undefined, verseKey: string | undefined) {
  return useQuery({
    queryKey: ['tafsir', tafsirId, verseKey],
    queryFn: () => fetchTafsirForVerse(tafsirId!, verseKey!),
    enabled: !!tafsirId && !!verseKey,
    staleTime: 1000 * 60 * 60 * 24,
    select: (data) => data.tafsir,
  });
}
