import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateClientId } from '@/lib/db';
import type { Bookmark } from '@/types/quran';

export function useOfflineBookmarks() {
  // Query all bookmarks and filter in JS (more reliable than indexed boolean query)
  const bookmarks = useLiveQuery(
    async () => {
      const all = await db.bookmarks.toArray();
      return all.filter(b => !b.isDeleted);
    },
    []
  );

  const addBookmark = async (
    surahId: number,
    ayahNumber: number,
    label?: string,
    color?: string
  ): Promise<Bookmark> => {
    try {
      // Check if bookmark already exists using filter instead of compound index
      const all = await db.bookmarks.toArray();
      const existing = all.find(b => b.surahId === surahId && b.ayahNumber === ayahNumber);

      if (existing && !existing.isDeleted) {
        return existing;
      }

      // If it was soft-deleted, restore it
      if (existing && existing.isDeleted) {
        const restored: Bookmark = {
          ...existing,
          isDeleted: false,
          updatedAt: Date.now(),
          version: existing.version + 1,
          isDirty: true,
          pendingOperation: existing.convexId ? 'update' : 'create',
        };
        await db.bookmarks.put(restored);
        return restored;
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
      console.log('[Bookmarks] Added bookmark:', bookmark);
      return bookmark;
    } catch (error) {
      console.error('[Bookmarks] Failed to add bookmark:', error);
      throw error;
    }
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
    try {
      const bookmark = await db.bookmarks.get(clientId);
      if (!bookmark) {
        console.warn('[Bookmarks] Bookmark not found:', clientId);
        return;
      }

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
        console.log('[Bookmarks] Soft deleted bookmark:', clientId);
      } else {
        // Hard delete if never synced
        await db.bookmarks.delete(clientId);
        console.log('[Bookmarks] Hard deleted bookmark:', clientId);
      }
    } catch (error) {
      console.error('[Bookmarks] Failed to remove bookmark:', error);
      throw error;
    }
  };

  const isBookmarked = async (surahId: number, ayahNumber: number): Promise<boolean> => {
    const all = await db.bookmarks.toArray();
    const bookmark = all.find(b => b.surahId === surahId && b.ayahNumber === ayahNumber);
    return !!bookmark && !bookmark.isDeleted;
  };

  const getBookmark = async (surahId: number, ayahNumber: number): Promise<Bookmark | undefined> => {
    const all = await db.bookmarks.toArray();
    const bookmark = all.find(b => b.surahId === surahId && b.ayahNumber === ayahNumber);
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
    async () => {
      const all = await db.bookmarks.toArray();
      return all.find(b => b.surahId === surahId && b.ayahNumber === ayahNumber) || null;
    },
    [surahId, ayahNumber]
  );

  return {
    isBookmarked: !!bookmark && !bookmark.isDeleted,
    bookmark: bookmark && !bookmark.isDeleted ? bookmark : undefined,
    isLoading: bookmark === undefined,
  };
}
