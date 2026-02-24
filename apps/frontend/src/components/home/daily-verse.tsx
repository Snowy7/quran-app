import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Heart, BookText, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import DOMPurify from 'dompurify';
import { getOfflineSurahWithTranslation } from '@/data/quran-data';
import { SURAHS } from '@/data/surahs';
import { fetchTafsir, AVAILABLE_TAFSIRS } from '@/lib/api/quran-api';
import { useOfflineSettings } from '@/lib/hooks';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface DailyVerseData {
  surahId: number;
  ayahNumber: number;
  arabic: string;
  translation: string;
  surahName: string;
  surahNameEn: string;
  juzNumber: number;
}

function getDailyVerses(): DailyVerseData[] {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const verses: DailyVerseData[] = [];

  for (let i = 0; i < 3; i++) {
    const seed = dayOfYear * 3 + i;
    const surahId = (seed % 114) + 1;
    const surah = SURAHS.find(s => s.id === surahId)!;
    const ayahNumber = (seed % surah.numberOfAyahs) + 1;

    const data = getOfflineSurahWithTranslation(surahId);
    const verse = data?.surah.verses.find(v => v.id === ayahNumber);

    verses.push({
      surahId,
      ayahNumber,
      arabic: verse?.text || '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0631\u064E\u0628\u0651\u0650 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E',
      translation: data?.translations[ayahNumber] || 'All praise and thanks be to the Lord of the worlds.',
      surahName: surah.name,
      surahNameEn: surah.englishName,
      juzNumber: surah.startJuz,
    });
  }

  return verses;
}

function VerseCard({
  verse,
  isActive,
}: {
  verse: DailyVerseData;
  isActive: boolean;
}) {
  const { t, isRTL } = useTranslation();
  const { settings } = useOfflineSettings();
  const [liked, setLiked] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirExpanded, setTafsirExpanded] = useState(false);
  const [tafsirLoading, setTafsirLoading] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;
    const tafsirId = settings.primaryTafsir || 16;

    setTafsirLoading(true);
    fetchTafsir(verse.surahId, tafsirId)
      .then((entries) => {
        if (cancelled) return;
        const entry = entries.find(e => e.verseKey === `${verse.surahId}:${verse.ayahNumber}`);
        if (entry) setTafsirText(entry.text);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setTafsirLoading(false);
      });

    return () => { cancelled = true; };
  }, [isActive, verse.surahId, verse.ayahNumber, settings.primaryTafsir]);

  const tafsirSource = AVAILABLE_TAFSIRS.find(tf => tf.id === (settings.primaryTafsir || 16));
  const isTafsirRTL = tafsirSource?.language === 'ar';

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Warm dark background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1e1814] to-[#14100d]" />

      {/* Content */}
      <div className="relative p-5 md:p-7">
        {/* Surah badge + heart */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-white/8 border border-white/10">
              <span className="font-arabic-ui text-xs text-amber-200/80">
                {isRTL ? verse.surahName : verse.surahNameEn}
              </span>
            </div>
            <span className="text-[10px] text-white/30 tabular-nums">
              {verse.surahId}:{verse.ayahNumber}
            </span>
          </div>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => setLiked(!liked)}
          >
            <Heart className={cn(
              'w-4 h-4 transition-all',
              liked ? 'fill-red-400 text-red-400 scale-110' : 'text-white/40'
            )} />
          </button>
        </div>

        {/* Arabic verse */}
        <p
          className="arabic-text text-xl md:text-2xl text-amber-100/90 leading-[2.2] text-center mb-4"
          dir="rtl"
        >
          {verse.arabic}
        </p>

        {/* Simple divider */}
        <div className="flex items-center justify-center gap-3 mb-4 opacity-20">
          <div className="w-12 h-px bg-amber-200" />
          <div className="w-1 h-1 rounded-full bg-amber-200" />
          <div className="w-12 h-px bg-amber-200" />
        </div>

        {/* Translation */}
        <p className="text-white/55 text-sm md:text-base leading-relaxed text-center italic mb-3">
          &ldquo;{verse.translation}&rdquo;
        </p>

        {/* Tafsir toggle */}
        {tafsirText && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setTafsirExpanded(!tafsirExpanded)}
              className="mx-auto flex items-center gap-1.5 text-amber-300/50 hover:text-amber-300/80 transition-colors text-xs"
            >
              <BookText className="w-3 h-3" />
              <span className={cn('font-medium', isRTL && 'font-arabic-ui')}>
                {t('tafseer')}
              </span>
              <ChevronDown className={cn(
                'w-3 h-3 transition-transform duration-200',
                tafsirExpanded && 'rotate-180'
              )} />
            </button>

            {tafsirExpanded && (
              <div
                className={cn(
                  'tafsir-content text-white/50 text-xs md:text-sm leading-relaxed mt-3',
                  'border-t border-white/5 pt-3 max-h-40 overflow-y-auto scrollbar-hide'
                )}
                dir={isTafsirRTL ? 'rtl' : 'ltr'}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tafsirText) }}
              />
            )}
          </div>
        )}

        {tafsirLoading && !tafsirText && (
          <div className="flex justify-center mt-2">
            <span className="text-white/20 text-xs animate-pulse-subtle">{t('tafseer')}...</span>
          </div>
        )}

        {/* Juz reference */}
        <p className="font-arabic-ui text-[10px] text-white/20 text-center mt-4">
          {isRTL
            ? `\u0627\u0644\u062C\u0632\u0621 ${verse.juzNumber}`
            : `Juz ${verse.juzNumber}`}
        </p>
      </div>
    </div>
  );
}

export function DailyVerse() {
  const verses = useMemo(() => getDailyVerses(), []);
  const { t, isRTL } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  const goTo = useCallback((index: number) => {
    setActiveIndex(Math.max(0, Math.min(index, verses.length - 1)));
  }, [verses.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
    touchEnd.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStart.current - touchEnd.current;
    if (Math.abs(diff) > 50) {
      setActiveIndex(prev => {
        if (diff > 0) return Math.min(prev + 1, verses.length - 1);
        return Math.max(prev - 1, 0);
      });
    }
  }, [verses.length]);

  return (
    <section className="animate-slide-up" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3" dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className="font-arabic-ui text-sm md:text-base font-semibold text-foreground/80">
          {t('dailyVerses')}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
              activeIndex > 0 ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground/30'
            )}
            disabled={activeIndex === 0}
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <span className="text-[11px] text-muted-foreground tabular-nums min-w-[2rem] text-center">
            {activeIndex + 1}/{verses.length}
          </span>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
              activeIndex < verses.length - 1 ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground/30'
            )}
            disabled={activeIndex === verses.length - 1}
          >
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Transform-based carousel — always LTR so transform direction is consistent */}
      <div className="overflow-hidden rounded-2xl" dir="ltr">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {verses.map((verse, i) => (
            <div key={`${verse.surahId}-${verse.ayahNumber}`} className="w-full flex-shrink-0">
              <VerseCard verse={verse} isActive={i === activeIndex} />
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {verses.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            className={cn(
              'rounded-full transition-all duration-300',
              i === activeIndex
                ? 'w-6 h-1.5 bg-primary'
                : 'w-1.5 h-1.5 bg-primary/25 hover:bg-primary/40'
            )}
          />
        ))}
      </div>
    </section>
  );
}
