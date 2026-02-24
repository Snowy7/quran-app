import { Link } from 'react-router-dom';
import { BookMarked, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@template/ui';
import { useOfflineBookmarks } from '@/lib/hooks';
import { getSurahById } from '@/data/surahs';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/layout/app-header';

export default function BookmarksPage() {
  const { bookmarks, removeBookmark, isLoading } = useOfflineBookmarks();
  const { t, isRTL } = useTranslation();

  const sortedBookmarks = [...bookmarks].sort((a, b) => b.createdAt - a.createdAt);
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="page-container" dir={isRTL ? 'rtl' : 'ltr'}>
      <AppHeader
        title={t('bookmarks')}
        rightContent={
          sortedBookmarks.length > 0 ? (
            <span className="text-sm text-muted-foreground me-2">
              {sortedBookmarks.length}
            </span>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sortedBookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <BookMarked className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className={cn('font-semibold mb-2', isRTL && 'font-arabic-ui')}>{t('noBookmarks')}</h2>
          <p className={cn('text-sm text-muted-foreground mb-6', isRTL && 'font-arabic-ui')}>
            {t('tapBookmarkHint')}
          </p>
          <Link to="/quran">
            <Button className={cn(isRTL && 'font-arabic-ui')}>{t('browseQuran')}</Button>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {sortedBookmarks.map((bookmark) => {
            const surah = getSurahById(bookmark.surahId);
            if (!surah) return null;

            return (
              <div key={bookmark.clientId} className="flex items-center">
                <Link
                  to={`/quran/${bookmark.surahId}`}
                  className="flex-1 flex items-center gap-4 px-4 py-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                    {bookmark.ayahNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-medium', isRTL && 'font-arabic-ui')}>
                      {isRTL ? surah.name : surah.englishName}
                    </p>
                    <p className={cn('text-sm text-muted-foreground', isRTL && 'font-arabic-ui')}>
                      {t('verse')} {bookmark.ayahNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(isRTL ? 'text-lg' : 'arabic-text text-lg')}>
                      {isRTL ? surah.englishName : surah.name}
                    </span>
                    <ChevronIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 me-2 text-muted-foreground hover:text-destructive"
                  onClick={() => removeBookmark(bookmark.clientId)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
