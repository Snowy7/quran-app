import AsyncStorage from "../storage/async-storage";
import type {
  Collection,
  Bookmark,
  HifzProgress,
  ReadingHistoryEntry,
} from "./types";

export type { Collection, Bookmark, HifzProgress, ReadingHistoryEntry };

// ---- Keys ----
const COLLECTIONS_KEY = "noor_collections";
const BOOKMARKS_KEY = "noor_bookmarks";
const HIFZ_KEY = "noor_hifz";
const READING_HISTORY_KEY = "noor_reading_history";
const LAST_READ_KEY = "noor_last_read";

// ---- Generic Helpers ----

async function getArray<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  return JSON.parse(raw) as T[];
}

async function setArray<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// ---- Collections ----

export async function getCollections(): Promise<Collection[]> {
  return getArray<Collection>(COLLECTIONS_KEY);
}

export async function addCollection(
  collection: Omit<Collection, "id" | "sortOrder" | "createdAt" | "updatedAt">,
): Promise<Collection> {
  const collections = await getCollections();
  const newCollection: Collection = {
    ...collection,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    sortOrder: collections.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  collections.push(newCollection);
  await setArray(COLLECTIONS_KEY, collections);
  return newCollection;
}

export async function deleteCollection(id: string): Promise<void> {
  const collections = await getCollections();
  await setArray(
    COLLECTIONS_KEY,
    collections.filter((c) => c.id !== id),
  );
  // Also remove associated bookmarks
  const bookmarks = await getBookmarks();
  await setArray(
    BOOKMARKS_KEY,
    bookmarks.filter((b) => b.collectionId !== id),
  );
}

// ---- Bookmarks ----

export async function getBookmarks(collectionId?: string): Promise<Bookmark[]> {
  const bookmarks = await getArray<Bookmark>(BOOKMARKS_KEY);
  if (collectionId) {
    return bookmarks.filter((b) => b.collectionId === collectionId);
  }
  return bookmarks;
}

export async function addBookmark(
  bookmark: Omit<Bookmark, "id" | "sortOrder" | "createdAt" | "updatedAt">,
): Promise<Bookmark> {
  const bookmarks = await getBookmarks();
  const newBookmark: Bookmark = {
    ...bookmark,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    sortOrder: bookmarks.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  bookmarks.push(newBookmark);
  await setArray(BOOKMARKS_KEY, bookmarks);
  return newBookmark;
}

export async function removeBookmark(id: string): Promise<void> {
  const bookmarks = await getBookmarks();
  await setArray(
    BOOKMARKS_KEY,
    bookmarks.filter((b) => b.id !== id),
  );
}

// ---- Reading History ----

export async function getLastRead(): Promise<ReadingHistoryEntry | null> {
  const raw = await AsyncStorage.getItem(LAST_READ_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as ReadingHistoryEntry;
}

export async function saveLastRead(
  entry: Omit<ReadingHistoryEntry, "id" | "timestamp">,
): Promise<void> {
  const historyEntry: ReadingHistoryEntry = {
    ...entry,
    id: Date.now().toString(36),
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify(historyEntry));

  // Also add to history
  const history = await getArray<ReadingHistoryEntry>(READING_HISTORY_KEY);
  history.unshift(historyEntry);
  // Keep last 100 entries
  await setArray(READING_HISTORY_KEY, history.slice(0, 100));
}

export async function getReadingHistory(): Promise<ReadingHistoryEntry[]> {
  return getArray<ReadingHistoryEntry>(READING_HISTORY_KEY);
}

// ---- Hifz Progress ----

export async function getHifzProgress(): Promise<HifzProgress[]> {
  return getArray<HifzProgress>(HIFZ_KEY);
}

export async function getDueReviews(): Promise<HifzProgress[]> {
  const progress = await getHifzProgress();
  const now = Date.now();
  return progress.filter(
    (p) => p.nextReviewAt !== undefined && p.nextReviewAt <= now,
  );
}

export async function getTotalProgress(): Promise<{
  total: number;
  memorized: number;
}> {
  const progress = await getHifzProgress();
  const memorized = progress.filter(
    (p) => p.confidence === "good" || p.confidence === "solid",
  ).length;
  return { total: 6236, memorized };
}

export async function getStreak(): Promise<number> {
  const progress = await getHifzProgress();
  if (progress.length === 0) return 0;

  // Simple streak calculation based on consecutive days with reviews
  const reviewed = progress
    .filter((p) => p.lastReviewedAt)
    .map((p) => {
      const d = new Date(p.lastReviewedAt!);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    });
  const uniqueDays = [...new Set(reviewed)];
  return Math.min(uniqueDays.length, 30);
}
