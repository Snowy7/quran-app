import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Skeleton } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { useChapters } from '@/lib/api/chapters';
import { SurahHeader } from '@/components/quran/surah-header';
import { ReadingModeToggle } from '@/components/quran/reading-mode-toggle';
import { TranslationView } from '@/components/quran/translation-view';

export default function SurahReaderPage() {
  const { surahId, juzId, pageId } = useParams();
  const location = useLocation();
  const [readingMode, setReadingMode] = useState('translation');

  const { data: chapters, isLoading: chaptersLoading } = useChapters();

  // Determine what we're reading
  const isJuzView = location.pathname.includes('/juz/');
  const isPageView = location.pathname.includes('/page/');

  const chapterId = surahId ? parseInt(surahId, 10) : undefined;
  const chapter = chapters?.find((c) => c.id === chapterId);

  // Header title
  const headerTitle = isJuzView
    ? `Juz ${juzId}`
    : isPageView
      ? `Page ${pageId}`
      : chapter?.nameSimple ?? `Surah ${surahId ?? ''}`;

  const headerSubtitle =
    !isJuzView && !isPageView && chapter
      ? `${chapter.translatedName.name}`
      : undefined;

  return (
    <div className="page-container">
      <AppHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        showBack
      />

      <div className="px-5 md:px-8">
        {/* Reading mode toggle */}
        <div className="py-3">
          <ReadingModeToggle mode={readingMode} onModeChange={setReadingMode} />
        </div>

        {/* Surah header card */}
        {chaptersLoading && (
          <div className="space-y-3 py-4">
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        )}

        {chapter && <SurahHeader chapter={chapter} />}
      </div>

      {/* Content area */}
      {readingMode === 'translation' && chapterId && (
        <TranslationView chapterId={chapterId} />
      )}

      {readingMode === 'translation' && !chapterId && !chaptersLoading && (
        <div className="px-5 py-12 text-center text-muted-foreground text-sm">
          {isJuzView
            ? 'Juz view is not yet available.'
            : isPageView
              ? 'Page view is not yet available.'
              : 'Invalid surah ID.'}
        </div>
      )}
    </div>
  );
}
