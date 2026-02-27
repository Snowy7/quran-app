import { useState, useEffect } from 'react';

// Track font loading state globally (across all components)
const loadedFonts = new Set<number>();
const loadingFonts = new Map<number, Promise<void>>();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

/**
 * Get the CSS font-family name for a specific mushaf page.
 * Matches quran.com's naming convention: p{N}-v2
 */
export function getPageFontFamily(pageNumber: number): string {
  return `p${pageNumber}-v2`;
}

/**
 * Check if a page's font has been loaded.
 */
export function isPageFontLoaded(pageNumber: number): boolean {
  return loadedFonts.has(pageNumber);
}

/**
 * Dynamically load a per-page QCF V2 font via the FontFace API.
 * Each of the 604 mushaf pages has its own font file.
 */
export async function loadPageFont(pageNumber: number): Promise<void> {
  if (loadedFonts.has(pageNumber)) return;

  const existing = loadingFonts.get(pageNumber);
  if (existing) return existing;

  const fontName = getPageFontFamily(pageNumber);
  const fontUrl = `/fonts/quran/hafs/v2/ttf/p${pageNumber}.ttf`;

  const promise = (async () => {
    try {
      const fontFace = new FontFace(
        fontName,
        `url('${fontUrl}') format('truetype')`,
      );
      fontFace.display = 'block';
      document.fonts.add(fontFace);
      await fontFace.load();
      loadedFonts.add(pageNumber);
      notifyListeners();
    } finally {
      loadingFonts.delete(pageNumber);
    }
  })();

  loadingFonts.set(pageNumber, promise);
  return promise;
}

/**
 * React hook that loads a per-page mushaf font and returns whether it's ready.
 */
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

    // Subscribe to font load notifications
    const onUpdate = () => {
      if (pageNumber && isPageFontLoaded(pageNumber)) {
        setLoaded(true);
      }
    };
    listeners.add(onUpdate);

    loadPageFont(pageNumber).catch(() => {});

    return () => {
      listeners.delete(onUpdate);
    };
  }, [pageNumber]);

  return loaded;
}

/**
 * React hook that loads fonts for multiple pages at once.
 * Returns the set of page numbers whose fonts are loaded.
 */
export function usePageFonts(pageNumbers: number[]): Set<number> {
  const [loadedSet, setLoadedSet] = useState<Set<number>>(() => {
    const s = new Set<number>();
    for (const p of pageNumbers) {
      if (isPageFontLoaded(p)) s.add(p);
    }
    return s;
  });

  useEffect(() => {
    const onUpdate = () => {
      setLoadedSet((prev) => {
        const next = new Set(prev);
        let changed = false;
        for (const p of pageNumbers) {
          if (!next.has(p) && isPageFontLoaded(p)) {
            next.add(p);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };

    listeners.add(onUpdate);

    // Kick off loading for all requested pages
    for (const p of pageNumbers) {
      if (!isPageFontLoaded(p)) {
        loadPageFont(p).catch(() => {});
      }
    }

    return () => {
      listeners.delete(onUpdate);
    };
  }, [pageNumbers.join(',')]);

  return loadedSet;
}
