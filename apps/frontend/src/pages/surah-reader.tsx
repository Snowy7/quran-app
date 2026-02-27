import { useState, useEffect } from 'react';
import { useParams, useLocation, useSearchParams } from 'react-router-dom';
import { Mic } from 'lucide-react';
import { Button, Skeleton } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { useChapters } from '@/lib/api/chapters';
import { SurahHeader } from '@/components/quran/surah-header';
import { ReadingModeToggle } from '@/components/quran/reading-mode-toggle';
import { TranslationView } from '@/components/quran/translation-view';
import { WordByWordView } from '@/components/quran/word-by-word-view';
import { MushafView } from '@/components/quran/mushaf-view';
import { ReciterPicker } from '@/components/audio/reciter-picker';
import { saveReadingPosition } from '@/lib/db/reading-history';
import { getSetting } from '@/lib/db/settings';

export default function SurahReaderPage() {
  const { surahId, juzId, pageId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [readingMode, setReadingMode] = useState('translation');
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);

  const { data: chapters, isLoading: chaptersLoading } = useChapters();

  const isJuzView = location.pathname.includes('/juz/');
  const isPageView = location.pathname.includes('/page/');

  const chapterId = surahId ? parseInt(surahId, 10) : undefined;
  const pageNumber = pageId ? parseInt(pageId, 10) : NaN;
  const chapter = chapters?.find((c) => c.id === chapterId);

  // Parse initial verse from query param (for scroll-to-verse from bookmarks)
  const initialVerse = searchParams.get('verse')
    ? parseInt(searchParams.get('verse')!, 10)
    : undefined;

  // Load persisted reading mode
  useEffect(() => {
    getSetting<string>('readingMode', 'translation').then((mode) => {
      if (mode === 'translation' || mode === 'word-by-word' || mode === 'mushaf') {
        setReadingMode(mode);
      }
    });
  }, []);

  // Save reading position on mount (uses initial verse or 1)
  useEffect(() => {
    if (chapterId) {
      saveReadingPosition(
        chapterId,
        initialVerse || 1,
        readingMode as 'translation' | 'mushaf' | 'word-by-word',
      ).catch(() => {});
    }
  }, [chapterId, readingMode, initialVerse]);

  const pageTitle = Number.isInteger(pageNumber) ? pageNumber : 'Invalid';
  const headerTitle = isJuzView
    ? `Juz ${juzId}`
    : isPageView
      ? `Page ${pageTitle}`
      : chapter?.name_simple ?? `Surah ${surahId ?? ''}`;

  const headerSubtitle =
    !isJuzView && !isPageView && chapter ? `${chapter.translated_name.name}` : undefined;

  const handleModeChange = (mode: string) => {
    setReadingMode(mode);
    import('@/lib/db/settings').then(({ setSetting }) => {
      setSetting('readingMode', mode);
    });
  };

  return (
    <div className="page-container">
      <AppHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        showBack
        rightContent={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => setReciterPickerOpen(true)}
          >
            <Mic className="h-4 w-4" />
            <span className="sr-only">Choose reciter</span>
          </Button>
        }
      />

      <div className="px-5 md:px-8">
        <div className="py-3">
          <ReadingModeToggle mode={readingMode} onModeChange={handleModeChange} />
        </div>

        {chaptersLoading && (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        )}

        {chapter && !isPageView && <SurahHeader chapter={chapter} />}
      </div>

      {/* Translation mode */}
      {readingMode === 'translation' && chapterId && (
        <TranslationView chapterId={chapterId} totalVerses={chapter?.verses_count} initialVerse={initialVerse} />
      )}

      {/* Word-by-word mode */}
      {readingMode === 'word-by-word' && chapterId && (
        <WordByWordView chapterId={chapterId} />
      )}

      {/* Mushaf mode */}
      {readingMode === 'mushaf' && chapterId && <MushafView chapterId={chapterId} />}
      {readingMode === 'mushaf' && isPageView && Number.isInteger(pageNumber) && !chapterId && (
        <MushafView startPage={pageNumber} endPage={pageNumber} />
      )}

      {/* Error states */}
      {!chapterId && !Number.isInteger(pageNumber) && !chaptersLoading && isPageView && (
        <div className="px-5 py-12 text-center text-muted-foreground text-sm">Invalid page number.</div>
      )}

      {!chapterId && !isPageView && !isJuzView && !chaptersLoading && (
        <div className="px-5 py-12 text-center text-muted-foreground text-sm">
          Invalid surah ID.
        </div>
      )}

      {isJuzView && !isPageView && (
        <div className="px-5 py-12 text-center text-muted-foreground text-sm">
          Juz-based mode is not yet available.
        </div>
      )}

      {isPageView && readingMode !== 'mushaf' && !chaptersLoading && Number.isInteger(pageNumber) && (
        <div className="px-5 py-12 text-center text-muted-foreground text-sm">
          Page mode only is available for page-based reading right now.
        </div>
      )}

      <ReciterPicker open={reciterPickerOpen} onOpenChange={setReciterPickerOpen} />
    </div>
  );
}
