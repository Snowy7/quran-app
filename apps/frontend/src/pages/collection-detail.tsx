import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Trash2, BookOpen } from "lucide-react";
import { Skeleton } from "@template/ui";
import { AppHeader } from "@/components/layout/app-header";
import { db } from "@/lib/db";
import { removeBookmark } from "@/lib/db/bookmarks";
import { useChapters } from "@/lib/api/chapters";
import { useTranslation } from "@/lib/i18n";

export default function CollectionDetailPage() {
  const { t } = useTranslation();
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
        ? db.bookmarks.where("collectionId").equals(id).sortBy("sortOrder")
        : [],
    [id],
  );

  const handleRemove = async (bookmarkId: string) => {
    await removeBookmark(bookmarkId);
  };

  if (collection === undefined && bookmarks === undefined) {
    return (
      <div className="animate-fade-in">
        <AppHeader title={t("collection")} showBack />
        <div className="px-6 py-6 space-y-3">
          <Skeleton className="h-5 w-32 rounded-xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="animate-fade-in">
        <AppHeader title={t("collection")} showBack />
        <div className="px-6 py-16 text-center text-sm text-muted-foreground">
          {t("collectionNotFound")}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <AppHeader title={collection.name} showBack />

      <div className="px-6 pb-8">
        {collection.description && (
          <p className="text-sm text-muted-foreground mb-5">
            {collection.description}
          </p>
        )}

        {!bookmarks || bookmarks.length === 0 ? (
          <div className="pt-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary/60 mx-auto mb-4">
              <BookOpen className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">
              {t("noSavedVersesYet")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("saveVersesHint")}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {bookmarks.map((bookmark) => {
              const chapter = chapters?.find(
                (c) => c.id === bookmark.chapterId,
              );
              const verseDisplay =
                bookmark.verseKey ||
                `${bookmark.chapterId}:${bookmark.verseNumber}`;
              return (
                <div
                  key={bookmark.id}
                  className="group flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-secondary/40 transition-colors"
                >
                  <button
                    onClick={() =>
                      navigate(
                        `/quran/${bookmark.chapterId}?verse=${bookmark.verseNumber}`,
                      )
                    }
                    className="flex-1 flex items-center gap-4 min-w-0 text-left"
                  >
                    <div
                      className="flex h-10 min-w-[40px] px-2 items-center justify-center rounded-xl shrink-0 text-[11px] font-bold tabular-nums"
                      style={{
                        backgroundColor: collection.color + "15",
                        color: collection.color,
                      }}
                    >
                      {verseDisplay}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {chapter?.name_simple ??
                          `${t("surah")} ${bookmark.chapterId}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {t("verse")} {bookmark.verseNumber}
                        {bookmark.note && ` — ${bookmark.note}`}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRemove(bookmark.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
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
