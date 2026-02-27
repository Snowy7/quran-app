import { useQuery } from '@tanstack/react-query';
import { fetchApi } from './client';
import type { RecitersResponse, ChapterRecitationResponse, VerseRecitationResponse } from './types';

export async function fetchReciters(language = 'en') {
  return fetchApi<RecitersResponse>('/resources/recitations', { language });
}

export async function fetchChapterRecitation(reciterId: number, chapterId: number) {
  return fetchApi<ChapterRecitationResponse>(
    `/recitations/${reciterId}/by_chapter/${chapterId}`,
  );
}

export async function fetchVerseRecitations(reciterId: number, chapterId: number) {
  return fetchApi<VerseRecitationResponse>(
    `/recitations/${reciterId}/by_chapter/${chapterId}`,
    { per_page: 286 },
  );
}

export function useReciters(language = 'en') {
  return useQuery({
    queryKey: ['reciters', language],
    queryFn: () => fetchReciters(language),
    staleTime: 1000 * 60 * 60 * 24,
    select: (data) => data.reciters,
  });
}

export function useChapterRecitation(
  reciterId: number | undefined,
  chapterId: number | undefined,
) {
  return useQuery({
    queryKey: ['recitation', reciterId, chapterId],
    queryFn: () => fetchChapterRecitation(reciterId!, chapterId!),
    enabled: !!reciterId && !!chapterId,
    staleTime: 1000 * 60 * 60 * 24,
    select: (data) => data.audioFile,
  });
}
