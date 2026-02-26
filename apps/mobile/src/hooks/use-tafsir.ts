import { useEffect, useState } from "react";
import { fetchTafsir } from "../lib/quran-api";
import type { TafsirEntry } from "../types/quran";

const tafsirCache = new Map<string, TafsirEntry[]>();
const tafsirRequests = new Map<string, Promise<TafsirEntry[]>>();

function getCacheKey(surahId: number, tafsirId: number): string {
  return `${tafsirId}:${surahId}`;
}

async function loadTafsir(surahId: number, tafsirId: number): Promise<TafsirEntry[]> {
  const key = getCacheKey(surahId, tafsirId);
  const cached = tafsirCache.get(key);
  if (cached) return cached;

  const existing = tafsirRequests.get(key);
  if (existing) return existing;

  const nextRequest = fetchTafsir(surahId, tafsirId)
    .then((entries) => {
      tafsirCache.set(key, entries);
      return entries;
    })
    .finally(() => {
      tafsirRequests.delete(key);
    });

  tafsirRequests.set(key, nextRequest);
  return nextRequest;
}

export function useTafsir(surahId: number, tafsirId = 16) {
  const key = getCacheKey(surahId, tafsirId);
  const [entries, setEntries] = useState<TafsirEntry[]>(tafsirCache.get(key) ?? []);
  const [loading, setLoading] = useState(!tafsirCache.has(key));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setError(null);
    setLoading(!tafsirCache.has(key));

    loadTafsir(surahId, tafsirId)
      .then((next) => {
        if (!mounted) return;
        setEntries(next);
      })
      .catch((unknownError) => {
        if (!mounted) return;
        const message =
          unknownError instanceof Error
            ? unknownError.message
            : "Unable to load tafsir";
        setError(message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [key, surahId, tafsirId]);

  return { entries, loading, error };
}
