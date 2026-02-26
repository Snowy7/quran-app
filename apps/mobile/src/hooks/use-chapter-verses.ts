import { useEffect, useState } from "react";
import { fetchChapterVerses } from "../lib/quran-api";
import type { Ayah } from "../types/quran";

const versesCache = new Map<number, Ayah[]>();
const verseRequests = new Map<number, Promise<Ayah[]>>();

async function loadVerses(surahId: number): Promise<Ayah[]> {
  const cached = versesCache.get(surahId);
  if (cached) return cached;

  const existingRequest = verseRequests.get(surahId);
  if (existingRequest) return existingRequest;

  const nextRequest = fetchChapterVerses(surahId)
    .then((ayahs) => {
      versesCache.set(surahId, ayahs);
      return ayahs;
    })
    .finally(() => {
      verseRequests.delete(surahId);
    });

  verseRequests.set(surahId, nextRequest);
  return nextRequest;
}

export function useChapterVerses(surahId: number) {
  const [ayahs, setAyahs] = useState<Ayah[]>(versesCache.get(surahId) ?? []);
  const [loading, setLoading] = useState(!versesCache.has(surahId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setError(null);
    setLoading(!versesCache.has(surahId));

    loadVerses(surahId)
      .then((nextAyahs) => {
        if (!mounted) return;
        setAyahs(nextAyahs);
      })
      .catch((unknownError) => {
        if (!mounted) return;
        const message =
          unknownError instanceof Error
            ? unknownError.message
            : "Unable to load ayahs";
        setError(message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [surahId]);

  return { ayahs, loading, error };
}

