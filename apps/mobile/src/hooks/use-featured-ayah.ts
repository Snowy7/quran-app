import { useEffect, useState } from "react";
import { fetchFeaturedVerse } from "../lib/quran-api";
import type { Ayah } from "../types/quran";

let featuredCache: Ayah | null = null;
let featuredRequest: Promise<Ayah> | null = null;

async function loadFeaturedAyah(): Promise<Ayah> {
  if (featuredCache) return featuredCache;
  if (featuredRequest) return featuredRequest;

  featuredRequest = fetchFeaturedVerse()
    .then((ayah) => {
      featuredCache = ayah;
      return ayah;
    })
    .finally(() => {
      featuredRequest = null;
    });

  return featuredRequest;
}

export function useFeaturedAyah() {
  const [ayah, setAyah] = useState<Ayah | null>(featuredCache);
  const [loading, setLoading] = useState(!featuredCache);

  useEffect(() => {
    if (featuredCache) return;

    let mounted = true;
    loadFeaturedAyah()
      .then((nextAyah) => {
        if (!mounted) return;
        setAyah(nextAyah);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { ayah, loading };
}

