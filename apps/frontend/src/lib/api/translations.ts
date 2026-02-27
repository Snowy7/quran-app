import { useQuery } from '@tanstack/react-query';
import { fetchApi } from './client';
import type { TranslationsListResponse } from './types';

export async function fetchAvailableTranslations(language = 'en') {
  return fetchApi<TranslationsListResponse>('/resources/translations', { language });
}

export function useAvailableTranslations(language = 'en') {
  return useQuery({
    queryKey: ['translations', language],
    queryFn: () => fetchAvailableTranslations(language),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    select: (data) => data.translations,
  });
}
