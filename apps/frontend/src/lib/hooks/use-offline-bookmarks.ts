import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateClientId } from '@/lib/db';
import type { Bookmark } from '@/types/quran';

export function useOfflineBookmarks() {
  const bookmarks = useLiveQuery(
    () => db.bookmarks.where('isDeleted').equals(0).toArray(),
    []
  );

  const addBookmark = async (
    surahId: number,
    ayahNumber: number,
    label?: string,
    color?: string
  ): Promise<Bookmark> => {
    // Check if bookmark already exists
    const existing = await db.bookmarks
      .where('[surahId+ayahNumber]')
      .equals([surahId, ayahNumber])
      .first();

    if (existing && !existing.isDeleted) {
      return existing;
    }

    const now = Date.now();
    const bookmark: Bookmark = {
      clientId: generateClientId(),
      surahId,
      ayahNumber,
      label,
      color,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      version: 1,
      isDirty: true,
      pendingOperation: 'create',
    };

    await db.bookmarks.put(bookmark);
    return bookmark;
  };

  const updateBookmark = async (
    clientId: string,
    updates: { label?: string; color?: string }
  ): Promise<Bookmark | null> => {
    const bookmark = await db.bookmarks.get(clientId);
    if (!bookmark) return null;

    const updated: Bookmark = {
      ...bookmark,
      ...updates,
      updatedAt: Date.now(),
      version: bookmark.version + 1,
      isDirty: true,
      pendingOperation: bookmark.convexId ? 'update' : 'create',
    };

    await db.bookmarks.put(updated);
    return updated;
  };

  const removeBookmark = async (clientId: string): Promise<void> => {
    const bookmark = await db.bookmarks.get(clientId);
    if (!bookmark) return;

    if (bookmark.convexId) {
      // Soft delete for sync
      const updated: Bookmark = {
        ...bookmark,
        isDeleted: true,
        updatedAt: Date.now(),
        version: bookmark.version + 1,
        isDirty: true,
        pendingOperation: 'delete',
      };
      await db.bookmarks.put(updated);
    } else {
      // Hard delete if never synced
      await db.bookmarks.delete(clientId);
    }
  };

  const isBookmarked = async (surahId: number, ayahNumber: number): Promise<boolean> => {
    const bookmark = await db.bookmarks
      .where('[surahId+ayahNumber]')
      .equals([surahId, ayahNumber])
      .first();
    return !!bookmark && !bookmark.isDeleted;
  };

  const getBookmark = async (surahId: number, ayahNumber: number): Promise<Bookmark | undefined> => {
    const bookmark = await db.bookmarks
      .where('[surahId+ayahNumber]')
      .equals([surahId, ayahNumber])
      .first();
    return bookmark && !bookmark.isDeleted ? bookmark : undefined;
  };

  return {
    bookmarks: bookmarks || [],
    addBookmark,
    updateBookmark,
    removeBookmark,
    isBookmarked,
    getBookmark,
    isLoading: bookmarks === undefined,
  };
}

// Hook for checking if a specific ayah is bookmarked
export function useIsBookmarked(surahId: number, ayahNumber: number) {
  const bookmark = useLiveQuery(
    () =>
      db.bookmarks
        .where('[surahId+ayahNumber]')
        .equals([surahId, ayahNumber])
        .first(),
    [surahId, ayahNumber]
  );

  return {
    isBookmarked: !!bookmark && !bookmark.isDeleted,
    bookmark: bookmark && !bookmark.isDeleted ? bookmark : undefined,
    isLoading: bookmark === undefined,
  };
}
