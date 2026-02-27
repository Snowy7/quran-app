import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchApi } from './client';
import type { VersesResponse, VersesParams } from './types';

const DEFAULT_WORD_FIELDS =
  'code_v2,text_uthmani,code_v1,position,page_number,line_number,v2_page';

function buildVersesParams(
  params: VersesParams = {},
  defaultPerPage: number | 'all' = 10,
) {
  return {
    page: params.page,
    per_page: params.perPage || defaultPerPage,
    translations: params.translations || '85', // Sahih International
    words: params.words ?? false,
    word_fields: params.words ? params.wordFields || DEFAULT_WORD_FIELDS : undefined,
    fields: params.fields || 'text_uthmani',
    language: params.language || 'en',
    filter_page_words: params.filterPageWords,
  };
}

export async function fetchVersesByChapter(
  chapterId: number,
  params: VersesParams = {},
) {
  return fetchApi<VersesResponse>(
    `/verses/by_chapter/${chapterId}`,
    buildVersesParams(params, 10),
  );
}

export async function fetchVersesByPage(
  pageNumber: number,
  params: VersesParams = {},
) {
  return fetchApi<VersesResponse>(
    `/verses/by_page/${pageNumber}`,
    buildVersesParams(
      {
        ...params,
        words: params.words ?? true,
        perPage: params.perPage || 'all',
        filterPageWords: true,
      },
      'all',
    ),
  );
}

export async function fetchVersesByJuz(
  juzNumber: number,
  params: VersesParams = {},
) {
  return fetchApi<VersesResponse>(
    `/verses/by_juz/${juzNumber}`,
    buildVersesParams(params, 10),
  );
}

export function useVersesByChapter(
  chapterId: number | undefined,
  params: VersesParams = {},
) {
  return useInfiniteQuery({
    queryKey: [
      'verses',
      'chapter',
      chapterId,
      params.translations,
      params.perPage,
      params.words,
      params.wordFields,
      params.fields,
      params.language,
    ],
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
    queryKey: [
      'verses',
      'page',
      pageNumber,
      params.translations,
      params.wordFields,
      params.fields,
      params.filterPageWords,
      params.language,
    ],
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
