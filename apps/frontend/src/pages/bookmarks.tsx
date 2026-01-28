import { Link } from 'react-router-dom';
import { BookMarked, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@template/ui';
import { useOfflineBookmarks } from '@/lib/hooks';
import { getSurahById } from '@/data/surahs';
import { AppHeader } from '@/components/layout/app-header';

export default function BookmarksPage() {
  const { bookmarks, removeBookmark, isLoading } = useOfflineBookmarks();

  const sortedBookmarks = [...bookmarks].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="page-container">
      <AppHeader
        title="Bookmarks"
        rightContent={
          sortedBookmarks.length > 0 ? (
            <span className="text-sm text-muted-foreground mr-2">
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
          <h2 className="font-semibold mb-2">No bookmarks</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Tap the bookmark icon on any verse to save it
          </p>
          <Link to="/quran">
            <Button>Browse Quran</Button>
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
                    <p className="font-medium">{surah.englishName}</p>
                    <p className="text-sm text-muted-foreground">
                      Verse {bookmark.ayahNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="arabic-text text-lg">{surah.name}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 mr-2 text-muted-foreground hover:text-destructive"
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
