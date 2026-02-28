import { useEffect, useMemo, useState } from "react";
import * as Font from "expo-font";

const loadedPages = new Set<number>();
const loadingPages = new Map<number, Promise<void>>();
const listeners = new Set<() => void>();
const FONT_SUFFIX = "-v2";

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function getPageFontFamily(pageNumber: number): string {
  return `p${pageNumber}${FONT_SUFFIX}`;
}

function getPageFontUrl(pageNumber: number): string {
  return `https://quran.com/fonts/quran/hafs/v2/ttf/p${pageNumber}.ttf`;
}

export function isPageFontLoaded(pageNumber: number): boolean {
  const family = getPageFontFamily(pageNumber);
  return loadedPages.has(pageNumber) || Font.isLoaded(family);
}

export async function loadPageFont(pageNumber: number): Promise<void> {
  if (pageNumber < 1 || pageNumber > 604) return;
  if (isPageFontLoaded(pageNumber)) {
    loadedPages.add(pageNumber);
    return;
  }

  const existing = loadingPages.get(pageNumber);
  if (existing) return existing;

  const family = getPageFontFamily(pageNumber);
  const url = getPageFontUrl(pageNumber);

  const promise = Font.loadAsync(family, { uri: url })
    .then(() => {
      loadedPages.add(pageNumber);
      notifyListeners();
    })
    .catch(() => {
      // Keep fallback rendering path when download fails.
    })
    .finally(() => {
      loadingPages.delete(pageNumber);
    });

  loadingPages.set(pageNumber, promise);
  return promise;
}

export function prefetchPageFonts(pageNumbers: number[]): void {
  for (const pageNumber of pageNumbers) {
    if (pageNumber >= 1 && pageNumber <= 604 && !isPageFontLoaded(pageNumber)) {
      loadPageFont(pageNumber).catch(() => {});
    }
  }
}

export function usePageFont(pageNumber: number | undefined): boolean {
  const [loaded, setLoaded] = useState(
    pageNumber ? isPageFontLoaded(pageNumber) : false,
  );

  useEffect(() => {
    if (!pageNumber) return;

    if (isPageFontLoaded(pageNumber)) {
      setLoaded(true);
      return;
    }

    const onUpdate = () => {
      if (isPageFontLoaded(pageNumber)) setLoaded(true);
    };
    listeners.add(onUpdate);

    loadPageFont(pageNumber).catch(() => {});

    return () => {
      listeners.delete(onUpdate);
    };
  }, [pageNumber]);

  return loaded;
}

export function usePageFonts(pageNumbers: number[]): Set<number> {
  const pageKey = useMemo(
    () => pageNumbers.slice().sort((a, b) => a - b).join(","),
    [pageNumbers],
  );

  const [loadedSet, setLoadedSet] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    for (const page of pageNumbers) {
      if (isPageFontLoaded(page)) initial.add(page);
    }
    return initial;
  });

  useEffect(() => {
    const onUpdate = () => {
      setLoadedSet((prev) => {
        const next = new Set(prev);
        let changed = false;
        for (const page of pageNumbers) {
          if (!next.has(page) && isPageFontLoaded(page)) {
            next.add(page);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };

    listeners.add(onUpdate);
    prefetchPageFonts(pageNumbers);

    return () => {
      listeners.delete(onUpdate);
    };
  }, [pageKey, pageNumbers]);

  return loadedSet;
}

