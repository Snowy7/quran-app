import { useState, useMemo } from 'react';
import { Heart } from 'lucide-react';
import { getOfflineSurahWithTranslation } from '@/data/quran-data';
import { SURAHS } from '@/data/surahs';
import { useTranslation } from '@/lib/i18n';

interface DailyVerse {
  surahId: number;
  ayahNumber: number;
  arabic: string;
  translation: string;
  surahName: string;
  surahNameEn: string;
  juzNumber: number;
}

function getDailyVerse(): DailyVerse {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const surahId = (dayOfYear % 114) + 1;
  const surah = SURAHS.find(s => s.id === surahId)!;
  const ayahNumber = (dayOfYear % surah.numberOfAyahs) + 1;

  const data = getOfflineSurahWithTranslation(surahId);
  const verse = data?.surah.verses.find(v => v.id === ayahNumber);

  return {
    surahId,
    ayahNumber,
    arabic: verse?.text || 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    translation: data?.translations[ayahNumber] || 'All praise and thanks be to the Lord of the worlds.',
    surahName: surah.name,
    surahNameEn: surah.englishName,
    juzNumber: surah.startJuz,
  };
}

export function DailyVerse() {
  const verse = useMemo(() => getDailyVerse(), []);
  const [liked, setLiked] = useState(false);
  const { t, language } = useTranslation();

  return (
    <section className="animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-2.5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <h3 className="font-arabic-ui text-base md:text-lg font-bold text-foreground">
          {t('dailyVerses')}
        </h3>
        <p className="font-arabic-ui text-sm text-primary">
          {language === 'ar' ? verse.surahName : verse.surahNameEn}
        </p>
      </div>

      {/* Dark verse card */}
      <div className="relative bg-[#2C2C2C] dark:bg-card rounded-2xl p-5 md:p-6 overflow-hidden border-l-[5px] border-l-accent">
        {/* Top row: heart + Arabic verse */}
        <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
          <button
            type="button"
            className="shrink-0 mt-1 text-white/50 hover:text-red-400 transition-colors"
            onClick={() => setLiked(!liked)}
          >
            <Heart className={`w-5 h-5 md:w-6 md:h-6 ${liked ? 'fill-red-400 text-red-400' : ''}`} />
          </button>
          <p
            className="arabic-text text-xl md:text-2xl text-card-content leading-[2]"
            dir="rtl"
          >
            {verse.arabic}
          </p>
        </div>

        {/* Translation */}
        <p className="text-white/80 text-sm md:text-base leading-relaxed mb-3 md:mb-4">
          {verse.translation}
        </p>

        {/* Surah reference */}
        <p className="font-arabic-ui text-[10px] md:text-xs text-card-content opacity-60 text-center">
          {language === 'ar'
            ? `${verse.surahName} - الجزء ${verse.juzNumber} - آية ${verse.ayahNumber}`
            : `${verse.surahNameEn} - Juz ${verse.juzNumber} - Ayah ${verse.ayahNumber}`}
        </p>

        {/* Page indicator dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <div className="w-4 h-2 rounded-full bg-white" />
        </div>
      </div>
    </section>
  );
}
