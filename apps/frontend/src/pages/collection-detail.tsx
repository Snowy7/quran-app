import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, BookOpen } from 'lucide-react';
import { Skeleton } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { db } from '@/lib/db';
import { removeBookmark } from '@/lib/db/bookmarks';
import { useChapters } from '@/lib/api/chapters';

export default function CollectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: chapters } = useChapters();

  const collection = useLiveQuery(
    () => (id ? db.collections.get(id) : undefined),
    [id],
  );

  const bookmarks = useLiveQuery(
    () =>
      id
        ? db.bookmarks
            .where('collectionId')
            .equals(id)
            .sortBy('sortOrder')
        : [],
    [id],
  );

  const handleRemove = async (bookmarkId: string) => {
    await removeBookmark(bookmarkId);
  };

  if (collection === undefined && bookmarks === undefined) {
    return (
      <div>
        <AppHeader title="Collection" showBack />
        <div className="px-5 py-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div>
        <AppHeader title="Collection" showBack />
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          Collection not found.
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppHeader title={collection.name} showBack />

      <div className="px-5 pb-8">
        {collection.description && (
          <p className="text-xs text-muted-foreground mb-4">
            {collection.description}
          </p>
        )}

        {!bookmarks || bookmarks.length === 0 ? (
          <div className="pt-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No saved verses yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Save verses from the reader using the bookmark icon
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 pt-2">
            {bookmarks.map((bookmark) => {
              const chapter = chapters?.find((c) => c.id === bookmark.chapterId);
              const verseDisplay = bookmark.verseKey || `${bookmark.chapterId}:${bookmark.verseNumber}`;
              return (
                <div
                  key={bookmark.id}
                  className="group flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary/60 transition-colors"
                >
                  <button
                    onClick={() => navigate(`/quran/${bookmark.chapterId}?verse=${bookmark.verseNumber}`)}
                    className="flex-1 flex items-center gap-3 min-w-0 text-left"
                  >
                    <div
                      className="flex h-9 min-w-[36px] px-2 items-center justify-center rounded-lg shrink-0 text-[11px] font-semibold tabular-nums"
                      style={{
                        backgroundColor: collection.color + '15',
                        color: collection.color,
                      }}
                    >
                      {verseDisplay}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {chapter?.name_simple ?? `Surah ${bookmark.chapterId}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Verse {bookmark.verseNumber}
                        {bookmark.note && ` — ${bookmark.note}`}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRemove(bookmark.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
