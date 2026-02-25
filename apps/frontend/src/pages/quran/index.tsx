import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, Book } from 'lucide-react';
import { Button } from '@template/ui';
import { SURAHS } from '@/data/surahs';
import { JUZ_DATA } from '@/data/juz';
import { useSidebarContext } from '@/components/layout/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type ViewMode = 'surah' | 'juz' | 'page';

const PAGES = Array.from({ length: 604 }, (_, i) => ({
  id: i + 1,
  label: `Page ${i + 1}`,
}));

const REVELATION_AR: Record<string, string> = {
  Meccan: 'مكية',
  Medinan: 'مدنية',
};

function toArabicNumerals(n: number): string {
  return n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

export default function QuranIndexPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('surah');
  const sidebar = useSidebarContext();
  const { t, language, isRTL } = useTranslation();

  return (
    <div className="page-container !pb-0 flex flex-col h-screen">
      {/* Sticky top: header + tabs */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm safe-area-top shrink-0">
        {/* App Bar */}
        <div className="flex items-center justify-between px-5 py-3 md:px-8">
          {isRTL ? (
            <>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary hover:bg-primary/10 lg:hidden"
                  onClick={sidebar.open}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <h1 className="font-arabic-ui text-xl font-bold text-primary">
                  {t('quran')}
                </h1>
              </div>
              <Link to="/search">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary hover:bg-primary/10"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/search">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary hover:bg-primary/10"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="font-arabic-ui text-xl font-bold text-primary">
                  {t('quran')}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary hover:bg-primary/10 lg:hidden"
                  onClick={sidebar.open}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            </>
          )}
          {/* Spacer on desktop when menu is hidden */}
          <div className="hidden lg:block w-9" />
        </div>

        {/* View mode toggle */}
        <div className="px-5 md:px-8 pb-3">
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            {(['surah', 'juz', 'page'] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-8 flex-1 text-xs capitalize font-arabic-ui',
                  viewMode === mode
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'text-primary/60 hover:bg-transparent hover:text-primary'
                )}
                onClick={() => setViewMode(mode)}
              >
                {mode === 'juz' ? t('juz') : mode === 'page' ? t('page') : t('surah')}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable list area */}
      <div className="flex-1 overflow-y-auto pb-nav lg:pb-6">
        {/* Surah List */}
        {viewMode === 'surah' && (
          <div className="px-5 md:px-8 flex flex-col gap-3">
            {SURAHS.map((surah, index) => (
              <Link
                key={surah.id}
                to={`/quran/${surah.id}`}
                className={cn(
                  'flex items-center gap-3 py-2',
                  'transition-all duration-200',
                  'hover:bg-secondary/50 active:scale-[0.99]',
                  'rounded-lg px-2 -mx-2',
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${Math.min(index * 20, 300)}ms`, animationFillMode: 'both' }}
              >
                {/* Number badge */}
                <div className={cn(
                  'w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0',
                  'text-xl md:text-2xl font-bold font-arabic-ui',
                  'bg-secondary text-primary'
                )}>
                  {language === 'ar' ? toArabicNumerals(surah.id) : surah.id}
                </div>

                {/* Surah name + info */}
                <div className="flex-1 flex flex-col px-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <p className="font-arabic-ui text-xl md:text-2xl font-bold text-primary leading-tight">
                    {language === 'ar' ? surah.name : surah.englishName}
                  </p>
                  <p className="text-sm text-accent">
                    {language === 'ar' ? (
                      <>آياتها {toArabicNumerals(surah.numberOfAyahs)} - {REVELATION_AR[surah.revelationType] || surah.revelationType}</>
                    ) : (
                      <>{surah.numberOfAyahs} {t('ayahs')} · {surah.revelationType === 'Meccan' ? t('meccan') : t('medinan')}</>
                    )}
                  </p>
                </div>

                {/* Arabic name (shown in English mode for reference) */}
                {language === 'en' && (
                  <span className="arabic-text text-lg text-primary/60 shrink-0">
                    {surah.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Juz List */}
        {viewMode === 'juz' && (
          <div className="px-5 md:px-8 flex flex-col gap-3">
            {JUZ_DATA.map((juz) => {
              const startSurah = SURAHS.find(s => s.id === juz.startSurah);
              return (
                <Link
                  key={juz.id}
                  to={`/quran/juz/${juz.id}`}
                  className="flex items-center gap-3 py-2 rounded-lg px-2 -mx-2 hover:bg-secondary/50 transition-colors"
                >
                  {/* Number badge */}
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-secondary flex items-center justify-center text-xl md:text-2xl font-bold font-arabic-ui text-primary shrink-0">
                    {language === 'ar' ? toArabicNumerals(juz.id) : juz.id}
                  </div>

                  {/* Juz name + info */}
                  <div className="flex-1 flex flex-col px-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <p className="font-arabic-ui text-xl md:text-2xl font-bold text-primary leading-tight">
                      {juz.arabicName}
                    </p>
                    <p className="font-arabic-ui text-sm text-accent">
                      {startSurah?.name} - {language === 'ar' ? `آية ${toArabicNumerals(juz.startAyah)}` : `Ayah ${juz.startAyah}`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Grid */}
        {viewMode === 'page' && (
          <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 px-5 md:px-8">
            {PAGES.map((page) => (
              <Link
                key={page.id}
                to={`/quran/page/${page.id}`}
                className="aspect-square flex flex-col items-center justify-center rounded-xl bg-secondary hover:bg-secondary/70 transition-colors"
              >
                <Book className="w-4 h-4 text-primary/40 mb-1" />
                <span className="text-xs font-medium text-primary">{toArabicNumerals(page.id)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
