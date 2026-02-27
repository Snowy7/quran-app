import { useQuery } from '@tanstack/react-query';
import { fetchApi } from './client';
import type { SearchResponse } from './types';

interface SearchParams {
  page?: number;
  size?: number;
  language?: string;
}

export async function fetchSearchResults(query: string, params: SearchParams = {}) {
  return fetchApi<SearchResponse>('/search', {
    q: query,
    page: params.page || 1,
    size: params.size || 20,
    language: params.language || 'en',
  });
}

export function useSearchVerses(query: string, params: SearchParams = {}) {
  return useQuery({
    queryKey: ['search', query, params.page, params.language],
    queryFn: () => fetchSearchResults(query, params),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data.search,
  });
}
