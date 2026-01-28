import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Ayah } from '@/types/quran';
import { BISMILLAH, SURAH_WITHOUT_BISMILLAH } from '@/data/surahs';

interface MushafViewProps {
  surahId: number;
  ayahs: Ayah[];
  arabicFontSize: number;
  arabicFontFamily: string;
  currentPlayingAyah: number | null;
  onAyahVisible: (ayahNumber: number) => void;
  onAyahClick: (ayahNumber: number) => void;
}

// Arabic number converter
function toArabicNumber(num: number): string {
  const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => arabicNums[parseInt(d)]).join('');
}

// Ayah end marker with decorative bracket and number
function AyahMarker({ number, isPlaying }: { number: number; isPlaying?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center mx-1.5 select-none align-middle',
        'transition-colors duration-200',
        isPlaying ? 'text-primary' : 'text-primary/70'
      )}
    >
      <span
        className="relative flex items-center justify-center"
        style={{ fontFamily: 'Amiri Quran, serif' }}
      >
        <span className="text-[0.65em]">﴿</span>
        <span className="text-[0.55em] mx-0.5" style={{ fontFamily: 'Amiri, serif' }}>
          {toArabicNumber(number)}
        </span>
        <span className="text-[0.65em]">﴾</span>
      </span>
    </span>
  );
}

export function MushafView({
  surahId,
  ayahs,
  arabicFontSize,
  arabicFontFamily,
  currentPlayingAyah,
  onAyahVisible,
  onAyahClick,
}: MushafViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ayahRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  // Track visible ayahs for reading progress
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const ayahNum = parseInt(entry.target.getAttribute('data-ayah') || '0');
            if (ayahNum > 0) {
              onAyahVisible(ayahNum);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    ayahRefs.current.forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ayahs, onAyahVisible]);

  // Scroll to playing ayah
  useEffect(() => {
    if (currentPlayingAyah !== null) {
      const el = ayahRefs.current.get(currentPlayingAyah);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentPlayingAyah]);

  const setAyahRef = useCallback((el: HTMLSpanElement | null, ayahNum: number) => {
    if (el) {
      ayahRefs.current.set(ayahNum, el);
    } else {
      ayahRefs.current.delete(ayahNum);
    }
  }, []);

  const showBismillah = surahId !== SURAH_WITHOUT_BISMILLAH && surahId !== 1;

  // Calculate line height based on font size for proper spacing
  const lineHeight = Math.max(2.4, 2.8 - (arabicFontSize - 24) * 0.02);

  return (
    <div ref={containerRef} className="px-6 py-8">
      {/* Decorative top border */}
      <div className="w-full max-w-md mx-auto mb-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="text-primary/50 text-lg">❁</div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </div>

      {/* Bismillah */}
      {showBismillah && (
        <div className="text-center mb-10">
          <p
            className={cn(
              'arabic-text inline-block px-8 py-4 text-foreground/80',
              'bg-secondary/30 rounded-lg',
              arabicFontFamily === 'scheherazade' && 'arabic-scheherazade',
              arabicFontFamily === 'uthmani' && 'arabic-uthmani'
            )}
            style={{ fontSize: `${arabicFontSize * 0.85}px`, lineHeight: 2 }}
          >
            {BISMILLAH}
          </p>
        </div>
      )}

      {/* Mushaf-style continuous text with decorative frame */}
      <div className="relative">
        {/* Decorative corner ornaments */}
        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-primary/20 rounded-tl-lg" />
        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-primary/20 rounded-tr-lg" />
        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-primary/20 rounded-bl-lg" />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-primary/20 rounded-br-lg" />

        <div
          className={cn(
            'arabic-text text-justify p-4',
            arabicFontFamily === 'scheherazade' && 'arabic-scheherazade',
            arabicFontFamily === 'uthmani' && 'arabic-uthmani'
          )}
          style={{
            fontSize: `${arabicFontSize}px`,
            lineHeight: lineHeight,
            wordSpacing: '0.15em',
          }}
        >
          {ayahs.map((ayah) => {
            const isPlaying = currentPlayingAyah === ayah.numberInSurah;

            return (
              <span
                key={ayah.numberInSurah}
                ref={(el) => setAyahRef(el, ayah.numberInSurah)}
                data-ayah={ayah.numberInSurah}
                onClick={() => onAyahClick(ayah.numberInSurah)}
                className={cn(
                  'cursor-pointer transition-all duration-200 rounded-sm',
                  isPlaying && 'bg-primary/15 text-primary px-1 -mx-1',
                  !isPlaying && 'hover:bg-secondary/50 active:bg-secondary'
                )}
              >
                {ayah.text}
                <AyahMarker number={ayah.numberInSurah} isPlaying={isPlaying} />
              </span>
            );
          })}
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="w-full max-w-md mx-auto mt-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="text-primary/50 text-lg">❁</div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
