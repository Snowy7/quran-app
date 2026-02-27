import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchApi } from './client';
import type { VersesResponse, VersesParams } from './types';

function buildVersesParams(params: VersesParams = {}) {
  return {
    page: params.page,
    per_page: params.perPage || 10,
    translations: params.translations || '85', // Sahih International
    words: params.words ?? true,
    word_fields: params.wordFields || 'code_v2,v2_page',
    fields: params.fields || 'text_uthmani',
    language: params.language || 'en',
  };
}

export async function fetchVersesByChapter(
  chapterId: number,
  params: VersesParams = {},
) {
  return fetchApi<VersesResponse>(
    `/verses/by_chapter/${chapterId}`,
    buildVersesParams(params),
  );
}

export async function fetchVersesByPage(
  pageNumber: number,
  params: VersesParams = {},
) {
  return fetchApi<VersesResponse>(
    `/verses/by_page/${pageNumber}`,
    buildVersesParams({ ...params, perPage: 50 }),
  );
}

export async function fetchVersesByJuz(
  juzNumber: number,
  params: VersesParams = {},
) {
  return fetchApi<VersesResponse>(
    `/verses/by_juz/${juzNumber}`,
    buildVersesParams(params),
  );
}

export function useVersesByChapter(
  chapterId: number | undefined,
  params: VersesParams = {},
) {
  return useInfiniteQuery({
    queryKey: ['verses', 'chapter', chapterId, params.translations, params.perPage],
    queryFn: ({ pageParam = 1 }) =>
      fetchVersesByChapter(chapterId!, { ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next_page ?? undefined,
    enabled: !!chapterId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useVersesByPage(
  pageNumber: number | undefined,
  params: VersesParams = {},
) {
  return useQuery({
    queryKey: ['verses', 'page', pageNumber, params.translations],
    queryFn: () => fetchVersesByPage(pageNumber!, params),
    enabled: !!pageNumber,
    staleTime: 1000 * 60 * 60,
    select: (data) => data.verses,
  });
}

export function useVersesByJuz(
  juzNumber: number | undefined,
  params: VersesParams = {},
) {
  return useInfiniteQuery({
    queryKey: ['verses', 'juz', juzNumber, params.translations],
    queryFn: ({ pageParam = 1 }) =>
      fetchVersesByJuz(juzNumber!, { ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next_page ?? undefined,
    enabled: !!juzNumber,
    staleTime: 1000 * 60 * 60,
  });
}
