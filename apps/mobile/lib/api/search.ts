import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./client";
import type { SearchResponse } from "./types";

export async function searchQuran(query: string, page = 1, language = "en") {
  return fetchApi<SearchResponse>("/search", {
    q: query,
    size: 20,
    page,
    language,
  });
}

export function useSearchQuran(query: string, language = "en") {
  return useQuery({
    queryKey: ["search", query, language],
    queryFn: () => searchQuran(query, 1, language),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
    select: (data) => data.search,
  });
}
