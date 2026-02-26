import { useEffect, useState } from "react";
import { fetchChapters } from "../lib/quran-api";
import type { SurahSummary } from "../types/quran";

let chaptersCache: SurahSummary[] | null = null;
let chaptersRequest: Promise<SurahSummary[]> | null = null;

async function loadChapters(): Promise<SurahSummary[]> {
  if (chaptersCache) return chaptersCache;
  if (chaptersRequest) return chaptersRequest;

  chaptersRequest = fetchChapters()
    .then((chapters) => {
      chaptersCache = chapters;
      return chapters;
    })
    .finally(() => {
      chaptersRequest = null;
    });

  return chaptersRequest;
}

export function useQuranCatalog() {
  const [chapters, setChapters] = useState<SurahSummary[]>(chaptersCache ?? []);
  const [loading, setLoading] = useState(!chaptersCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chaptersCache) return;

    let mounted = true;
    loadChapters()
      .then((next) => {
        if (!mounted) return;
        setChapters(next);
        setError(null);
      })
      .catch((unknownError) => {
        if (!mounted) return;
        const message =
          unknownError instanceof Error
            ? unknownError.message
            : "Unable to load surahs";
        setError(message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { chapters, loading, error };
}

