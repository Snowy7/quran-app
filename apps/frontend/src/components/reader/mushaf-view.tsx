import { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { getSurahById, SURAH_WITHOUT_BISMILLAH } from '@/data/surahs';
import {
  loadUthmaniData,
  getUthmaniSurahSync,
  getSurahPagesSync,
  loadQcfData,
  getQcfSurahSync,
  loadPageFont,
  getPageFontFamily,
  type UthmaniSurah,
  type UthmaniAyah,
} from '@/data/quran-uthmani-data';
import type { Ayah } from '@/types/quran';

const LONG_PRESS_MS = 500;

interface MushafViewProps {
  surahId: number;
  ayahs: Ayah[];
  arabicFontSize: number;
  arabicFontFamily: string;
  currentPlayingAyah: number | null;
  onAyahVisible: (ayahNumber: number) => void;
  onAyahClick: (ayahNumber: number) => void;
  onAyahLongPress?: (ayahNumber: number) => void;
}

function toArabicNumber(num: number): string {
  const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => arabicNums[parseInt(d)]).join('');
}

/** Hook to load both Uthmani data and QCF v2 text */
function useMushafData(surahId: number) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    Promise.all([loadUthmaniData(), loadQcfData()]).then(() => setLoaded(true));
  }, [surahId]);

  const uthmaniSurah = loaded ? getUthmaniSurahSync(surahId) : undefined;
  const qcfVerses = loaded ? getQcfSurahSync(surahId) : undefined;
  const pages = loaded ? getSurahPagesSync(surahId) : [];

  return { uthmaniSurah, qcfVerses, pages, loaded };
}

/** Hook to load a per-page font and return its font-family when ready */
function usePageFont(pageNumber: number) {
  const [fontFamily, setFontFamily] = useState<string | null>(null);

  useEffect(() => {
    setFontFamily(null);
    loadPageFont(pageNumber).then(() => {
      setFontFamily(getPageFontFamily(pageNumber));
    });
  }, [pageNumber]);

  return fontFamily;
}

/** Surah header banner - uses UthmanTN for prefix, SurahNames for the name */
function SurahBanner({ surahNumber, surahName }: { surahNumber: number; surahName: string }) {
  const surahMeta = getSurahById(surahNumber);
  const displayName = surahMeta?.name || surahName;

  return (
    <div className="flex items-center justify-center my-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-primary/30" />
      <div className="mx-3 px-6 py-1.5 border border-primary/25 rounded-sm bg-background">
        <p className="text-center text-primary leading-relaxed" dir="rtl">
          <span
            style={{ fontFamily: "'UthmanTN', serif", fontSize: '18px' }}
          >
            سُورَةُ{' '}
          </span>
          <span
            style={{ fontFamily: "'SurahNames', 'UthmanTN', serif", fontSize: '22px' }}
          >
            {displayName}
          </span>
        </p>
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-primary/30 to-primary/30" />
    </div>
  );
}

/** Bismillah line - standard Unicode text with UthmanTN font */
function Bismillah() {
  return (
    <p
      className="text-center my-3 text-foreground/80"
      style={{
        fontFamily: "'UthmanTN', 'Amiri Quran', serif",
        fontSize: '24px',
        direction: 'rtl',
        lineHeight: 2,
      }}
    >
      بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
    </p>
  );
}

/**
 * Check if a QCF verse's text begins with the bismillah codepoint sequence.
 * In QCF v2 encoding, the bismillah is 5 word-glyphs. Some surahs embed these
 * at the start of ayah 1; others don't (the bismillah is a separate page element).
 */
function qcfTextHasBismillah(qcfText: string, bismillahText: string): boolean {
  if (!bismillahText || !qcfText) return false;
  // The bismillah text is 5 words separated by spaces (e.g., "X X X X X").
  // Check if the verse text starts with these exact 5 word-glyphs.
  return qcfText.startsWith(bismillahText);
}

/** Single mushaf page with per-page QCF font */
function MushafPage({
  pageNumber,
  surahId,
  uthmaniSurah,
  qcfVerses,
  bismillahQcfText,
  currentPlayingAyah,
  onAyahClick,
  onAyahLongPress,
  onAyahRef,
  fontSize,
}: {
  pageNumber: number;
  surahId: number;
  uthmaniSurah: UthmaniSurah;
  qcfVerses: { k: string; t: string; p: number }[] | undefined;
  bismillahQcfText: string | undefined;
  currentPlayingAyah: number | null;
  onAyahClick: (ayahNumber: number) => void;
  onAyahLongPress?: (ayahNumber: number) => void;
  onAyahRef: (el: HTMLSpanElement | null, ayahNum: number) => void;
  fontSize: number;
}) {
  const pageFontFamily = usePageFont(pageNumber);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  // Get this surah's ayahs on this page (from Uthmani data for metadata)
  const pageAyahs = uthmaniSurah.ayahs.filter((a: UthmaniAyah) => a.page === pageNumber);
  if (pageAyahs.length === 0) return null;

  const firstAyahOnPage = pageAyahs[0];
  const surahStartsHere = firstAyahOnPage.numberInSurah === 1;
  const needsBismillah = surahStartsHere && surahId !== 1 && surahId !== SURAH_WITHOUT_BISMILLAH;

  // Check if the QCF data already includes the bismillah in ayah 1's text.
  // If so, the per-page font will render it — no separate Bismillah component needed.
  const qcfAyah1 = qcfVerses?.find(v => v.k === `${surahId}:1`);
  const bismillahEmbedded = !!(
    needsBismillah &&
    qcfAyah1 &&
    bismillahQcfText &&
    qcfTextHasBismillah(qcfAyah1.t, bismillahQcfText)
  );

  // Only show separate bismillah if the QCF data does NOT embed it in ayah 1
  const showSeparateBismillah = needsBismillah && !bismillahEmbedded;

  // Don't render QCF text until the per-page font is loaded (prevents FOUT)
  const fontReady = !!pageFontFamily;

  // Per-page font (only used when font is loaded)
  const textFontFamily = pageFontFamily
    ? `'${pageFontFamily}', 'UthmanTN', serif`
    : "'UthmanTN', serif";

  return (
    <div className="mb-6">
      <div className="border border-primary/20 rounded">
        <div className="border border-primary/10 rounded m-0.5 px-3 py-4 md:px-6 md:py-6">
          {surahStartsHere && (
            <SurahBanner surahNumber={surahId} surahName={uthmaniSurah.name} />
          )}

          {showSeparateBismillah && (
            <Bismillah />
          )}

          {!fontReady ? (
            /* Show loading placeholder until per-page font is ready */
            <div className="flex items-center justify-center py-16">
              <div className="animate-pulse-subtle text-muted-foreground text-sm">
                Loading page {toArabicNumber(pageNumber)}...
              </div>
            </div>
          ) : (
            /* Quran text with per-page QCF font */
            <div
              style={{
                fontFamily: textFontFamily,
                fontSize: `${fontSize}px`,
                direction: 'rtl',
                textAlign: surahId === 1 ? 'center' : 'justify',
                lineHeight: 1.9,
                overflowWrap: 'anywhere',
              }}
            >
              {pageAyahs.map((ayah: UthmaniAyah) => {
                const isPlaying = currentPlayingAyah === ayah.numberInSurah;
                // Use QCF v2 encoded text if available, fall back to Uthmani Unicode
                const qcfVerse = qcfVerses?.find(v => v.k === `${surahId}:${ayah.numberInSurah}`);
                const displayText = qcfVerse?.t || ayah.text;

                return (
                  <span
                    key={ayah.numberInSurah}
                    ref={(el) => onAyahRef(el, ayah.numberInSurah)}
                    data-ayah={ayah.numberInSurah}
                    onClick={() => {
                      // Don't fire click if long-press just happened
                      if (longPressFired.current) {
                        longPressFired.current = false;
                        return;
                      }
                      onAyahClick(ayah.numberInSurah);
                    }}
                    onContextMenu={(e) => {
                      if (onAyahLongPress) e.preventDefault();
                    }}
                    onPointerDown={() => {
                      longPressFired.current = false;
                      longPressTimer.current = setTimeout(() => {
                        longPressFired.current = true;
                        onAyahLongPress?.(ayah.numberInSurah);
                      }, LONG_PRESS_MS);
                    }}
                    onPointerUp={() => {
                      if (longPressTimer.current) {
                        clearTimeout(longPressTimer.current);
                        longPressTimer.current = null;
                      }
                    }}
                    onPointerCancel={() => {
                      if (longPressTimer.current) {
                        clearTimeout(longPressTimer.current);
                        longPressTimer.current = null;
                      }
                    }}
                    className={cn(
                      'cursor-pointer transition-colors duration-150 select-none',
                      isPlaying && 'bg-primary/10 text-primary rounded-sm',
                      !isPlaying && 'hover:bg-secondary/50'
                    )}
                  >
                    {displayText}
                    {' '}
                  </span>
                );
              })}
            </div>
          )}

          {/* Page number */}
          <div className="flex items-center justify-center mt-6 pt-3 border-t border-primary/10">
            <span className="text-xs text-muted-foreground font-medium" style={{ fontFamily: "'Almarai', sans-serif" }}>
              {toArabicNumber(pageNumber)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MushafView({
  surahId,
  ayahs,
  arabicFontSize,
  currentPlayingAyah,
  onAyahVisible,
  onAyahClick,
  onAyahLongPress,
}: MushafViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ayahRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const { uthmaniSurah, qcfVerses, pages, loaded } = useMushafData(surahId);

  const mushafFontSize = Math.min(Math.max(arabicFontSize, 18), 24);

  // QCF bismillah text from 1:1 (used to detect if bismillah is embedded in ayah 1)
  const qcf1 = loaded ? getQcfSurahSync(1) : undefined;
  const bismillahQcfText = qcf1?.[0]?.t;

  // Intersection observer for ayah visibility tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const ayahNum = parseInt(entry.target.getAttribute('data-ayah') || '0');
            if (ayahNum > 0) onAyahVisible(ayahNum);
          }
        });
      },
      { threshold: 0.5 }
    );

    ayahRefs.current.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [loaded, onAyahVisible]);

  // Auto-scroll to currently playing ayah
  useEffect(() => {
    if (currentPlayingAyah !== null) {
      const el = ayahRefs.current.get(currentPlayingAyah);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentPlayingAyah]);

  const setAyahRef = useCallback((el: HTMLSpanElement | null, ayahNum: number) => {
    if (el) {
      ayahRefs.current.set(ayahNum, el);
    } else {
      ayahRefs.current.delete(ayahNum);
    }
  }, []);

  if (!loaded || !uthmaniSurah) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse-subtle text-muted-foreground text-sm">Loading mushaf...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-xl mx-auto px-2 py-4 md:px-4">
      {pages.map((pageNumber: number) => (
        <MushafPage
          key={pageNumber}
          pageNumber={pageNumber}
          surahId={surahId}
          uthmaniSurah={uthmaniSurah}
          qcfVerses={qcfVerses}
          bismillahQcfText={bismillahQcfText}
          currentPlayingAyah={currentPlayingAyah}
          onAyahClick={onAyahClick}
          onAyahLongPress={onAyahLongPress}
          onAyahRef={setAyahRef}
          fontSize={mushafFontSize}
        />
      ))}
    </div>
  );
}
