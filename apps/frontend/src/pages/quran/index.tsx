import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Book } from 'lucide-react';
import { Button } from '@template/ui';
import { SURAHS } from '@/data/surahs';
import { JUZ_DATA } from '@/data/juz';
import { AppHeader } from '@/components/layout/app-header';
import { useOfflineReadingProgress } from '@/lib/hooks';
import { cn } from '@/lib/utils';

type ViewMode = 'surah' | 'juz' | 'page';

// Generate page data (604 pages in standard Mushaf)
const PAGES = Array.from({ length: 604 }, (_, i) => ({
  id: i + 1,
  label: `Page ${i + 1}`,
}));

export default function QuranIndexPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('surah');
  const { progress } = useOfflineReadingProgress();

  const lastSurah = progress?.lastSurahId ? SURAHS.find(s => s.id === progress.lastSurahId) : null;

  return (
    <div className="page-container">
      <AppHeader title="Quran" />

      {/* Last Read Hero */}
      <Link
        to={lastSurah ? `/quran/${lastSurah.id}` : '/quran/1'}
        className="block mx-4 mt-4 mb-6 animate-fade-in"
      >
        <div className="relative h-[120px] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]">
          {/* Gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgb(251 191 36 / 0.9) 0%, rgb(245 158 11 / 0.85) 50%, rgb(217 119 6 / 0.9) 100%)',
            }}
          />

          {/* Mosque silhouette on the right */}
          <div className="absolute right-0 bottom-0 h-full w-1/2 pointer-events-none">
            <img
              src="/images/hero.png"
              alt=""
              className="absolute bottom-0 right-0 h-[140%] w-auto opacity-20"
              style={{
                filter: 'brightness(0.2)',
                maskImage: 'linear-gradient(to left, black 30%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 100%)',
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-center px-5">
            <p className="text-amber-100/80 text-xs font-medium mb-1">Last Read</p>
            <h2 className="text-white text-2xl font-bold mb-0.5">
              {lastSurah?.englishName || 'Al-Fatihah'}
            </h2>
            <p className="text-amber-100/90 text-sm">
              Ayah No: {progress?.lastAyahNumber || 1}
            </p>
          </div>
        </div>
      </Link>

      {/* Section Header with Filters */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-semibold">Al Quran</h2>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {(['surah', 'juz', 'page'] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 px-3 text-xs capitalize',
                viewMode !== mode && 'hover:bg-transparent'
              )}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'juz' ? 'Juz' : mode === 'page' ? 'Page' : 'Surah'}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border">
        {viewMode === 'surah' && (
          <>
            {SURAHS.map((surah) => (
              <Link
                key={surah.id}
                to={`/quran/${surah.id}`}
                className={cn(
                  'flex items-center gap-4 px-4 py-3',
                  'transition-all duration-200 ease-out',
                  'hover:bg-secondary/50 active:bg-secondary/70 active:scale-[0.99]'
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
                  {surah.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{surah.englishName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded-md',
                      surah.revelationType === 'Meccan'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'
                    )}>
                      {surah.revelationType === 'Meccan' ? 'Makkah' : 'Madinah'}
                    </span>
                    <span>•</span>
                    <span>{surah.numberOfAyahs} Ayahs</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="arabic-text text-lg">{surah.name}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </>
        )}

        {viewMode === 'juz' && (
          <>
            {JUZ_DATA.map((juz) => {
              const startSurah = SURAHS.find(s => s.id === juz.startSurah);
              return (
                <Link
                  key={juz.id}
                  to={`/quran/juz/${juz.id}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
                    {juz.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{juz.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Starts: {startSurah?.englishName} {juz.startAyah}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="arabic-text text-lg">{juz.arabicName}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </>
        )}

        {viewMode === 'page' && (
          <div className="grid grid-cols-5 gap-2 p-4">
            {PAGES.map((page) => (
              <Link
                key={page.id}
                to={`/quran/page/${page.id}`}
                className="aspect-square flex flex-col items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Book className="w-4 h-4 text-muted-foreground mb-1" />
                <span className="text-xs font-medium">{page.id}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {SURAHS.length === 0 && viewMode === 'surah' && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No surahs found</p>
        </div>
      )}
    </div>
  );
}
