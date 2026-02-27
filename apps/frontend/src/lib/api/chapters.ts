import { useQuery } from '@tanstack/react-query';
import { fetchApi } from './client';
import type { ChaptersResponse, ChapterInfoResponse } from './types';

export async function fetchChapters(language = 'en') {
  return fetchApi<ChaptersResponse>('/chapters', { language });
}

export async function fetchChapterInfo(chapterId: number, language = 'en') {
  return fetchApi<ChapterInfoResponse>(`/chapters/${chapterId}/info`, { language });
}

export function useChapters(language = 'en') {
  return useQuery({
    queryKey: ['chapters', language],
    queryFn: () => fetchChapters(language),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    select: (data) => data.chapters,
  });
}

export function useChapterInfo(chapterId: number | undefined, language = 'en') {
  return useQuery({
    queryKey: ['chapter-info', chapterId, language],
    queryFn: () => fetchChapterInfo(chapterId!, language),
    enabled: !!chapterId,
    staleTime: 1000 * 60 * 60 * 24,
    select: (data) => data.chapter_info,
  });
}
