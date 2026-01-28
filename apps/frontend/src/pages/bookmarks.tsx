import { Link } from 'react-router-dom';
import { BookMarked, Trash2, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { useOfflineBookmarks } from '@/lib/hooks';
import { getSurahById } from '@/data/surahs';
import { formatDistanceToNow } from 'date-fns';

export default function BookmarksPage() {
  const { bookmarks, removeBookmark, isLoading } = useOfflineBookmarks();

  // Sort bookmarks by creation date (newest first)
  const sortedBookmarks = [...bookmarks].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="page-container">
      <AppHeader title="Bookmarks" showSearch={false} />

      <main className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 animate-pulse">
                  <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookMarked className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No bookmarks yet</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Tap the bookmark icon on any verse to save it here
            </p>
            <Link to="/quran">
              <Button>Browse Quran</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBookmarks.map((bookmark) => {
              const surah = getSurahById(bookmark.surahId);
              if (!surah) return null;

              return (
                <Card key={bookmark.clientId} className="group">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <Link
                        to={`/quran/${bookmark.surahId}`}
                        className="flex-1 p-4 flex items-center gap-3"
                      >
                        <div
                          className="w-2 h-12 rounded-full"
                          style={{ backgroundColor: bookmark.color || 'hsl(var(--primary))' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">
                              {surah.englishName}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              {bookmark.surahId}:{bookmark.ayahNumber}
                            </span>
                          </div>
                          {bookmark.label ? (
                            <p className="text-sm text-muted-foreground truncate">
                              {bookmark.label}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Verse {bookmark.ayahNumber}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(bookmark.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="arabic-text text-lg">{surah.name}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-auto w-12 rounded-none border-l opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeBookmark(bookmark.clientId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
