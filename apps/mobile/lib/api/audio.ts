import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./client";
import type { RecitersResponse, VerseRecitationResponse } from "./types";

export async function fetchReciters(language = "en") {
  return fetchApi<RecitersResponse>("/resources/recitations", { language });
}

export async function fetchVerseRecitations(
  reciterId: number,
  chapterId: number,
) {
  return fetchApi<VerseRecitationResponse>(
    `/recitations/${reciterId}/by_chapter/${chapterId}`,
    { per_page: 300 },
  );
}

export function useReciters(language = "en") {
  return useQuery({
    queryKey: ["reciters", language],
    queryFn: () => fetchReciters(language),
    staleTime: 1000 * 60 * 60 * 24,
    select: (data) => data.reciters,
  });
}

export function useVerseRecitations(
  reciterId: number | undefined,
  chapterId: number | undefined,
) {
  return useQuery({
    queryKey: ["verse-recitations", reciterId, chapterId],
    queryFn: () => fetchVerseRecitations(reciterId!, chapterId!),
    enabled: !!reciterId && !!chapterId,
    staleTime: 1000 * 60 * 60 * 24,
    select: (data) => data.audio_files,
  });
}
