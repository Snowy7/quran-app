import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  BookmarkEntry,
  ReaderPreferences,
  ReadingProgress,
  SyncStatus,
} from "../types/quran";
import {
  defaultPreferences,
  defaultReadingProgress,
  getOrCreateDeviceId,
  loadBookmarks,
  loadPreferences,
  loadReadingProgress,
  saveBookmarks,
  savePreferences,
  saveReadingProgress,
} from "../lib/local-store";
import {
  deleteBookmarkFromCloud,
  fetchCloudSnapshot,
  isBackendEnabled,
  syncBookmarksToCloud,
  syncReadingProgressToCloud,
  syncSettingsToCloud,
} from "../lib/backend-sync";

interface AppStateContextValue {
  isHydrated: boolean;
  deviceId: string | null;
  backendEnabled: boolean;
  bookmarks: BookmarkEntry[];
  preferences: ReaderPreferences;
  readingProgress: ReadingProgress;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: number | null;
  toggleBookmark: (
    surahId: number,
    surahName: string,
    ayahNumber: number,
    ayahText?: string,
  ) => void;
  isBookmarked: (surahId: number, ayahNumber: number) => boolean;
  updatePreferences: (updates: Partial<ReaderPreferences>) => void;
  recordReadingPosition: (surahId: number, ayahNumber: number) => void;
  syncNow: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

function bookmarkKey(surahId: number, ayahNumber: number): string {
  return `${surahId}:${ayahNumber}`;
}

function mergeCloudBookmarks(
  local: BookmarkEntry[],
  cloud: Array<{
    surahId: number;
    ayahNumber: number;
    note?: string;
    color?: string;
    createdAt: number;
    updatedAt: number;
  }>,
): BookmarkEntry[] {
  const merged = new Map<string, BookmarkEntry>();

  for (const bookmark of local) {
    merged.set(bookmarkKey(bookmark.surahId, bookmark.ayahNumber), bookmark);
  }

  for (const cloudBookmark of cloud) {
    const key = bookmarkKey(cloudBookmark.surahId, cloudBookmark.ayahNumber);
    const existing = merged.get(key);
    if (!existing || cloudBookmark.updatedAt > existing.updatedAt) {
      merged.set(key, {
        surahId: cloudBookmark.surahId,
        surahName: existing?.surahName ?? `Surah ${cloudBookmark.surahId}`,
        ayahNumber: cloudBookmark.ayahNumber,
        ayahText: existing?.ayahText,
        note: cloudBookmark.note,
        color: cloudBookmark.color,
        createdAt: cloudBookmark.createdAt,
        updatedAt: cloudBookmark.updatedAt,
      });
    }
  }

  return Array.from(merged.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [preferences, setPreferences] =
    useState<ReaderPreferences>(defaultPreferences);
  const [readingProgress, setReadingProgress] =
    useState<ReadingProgress>(defaultReadingProgress);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    isBackendEnabled ? "idle" : "disabled",
  );
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const initialSyncDoneRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const [nextDeviceId, nextBookmarks, nextPreferences, nextProgress] =
        await Promise.all([
          getOrCreateDeviceId(),
          loadBookmarks(),
          loadPreferences(),
          loadReadingProgress(),
        ]);

      if (!mounted) return;

      setDeviceId(nextDeviceId);
      setBookmarks(nextBookmarks);
      setPreferences(nextPreferences);
      setReadingProgress(nextProgress);
      setIsHydrated(true);
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const syncSnapshot = useCallback(
    async (snapshot: {
      bookmarks: BookmarkEntry[];
      preferences: ReaderPreferences;
      readingProgress: ReadingProgress;
    }) => {
      if (!isBackendEnabled || !deviceId) {
        setSyncStatus("disabled");
        return;
      }

      setSyncStatus("syncing");
      setSyncError(null);

      try {
        await Promise.all([
          syncBookmarksToCloud(deviceId, snapshot.bookmarks),
          syncSettingsToCloud(deviceId, snapshot.preferences),
          syncReadingProgressToCloud(deviceId, snapshot.readingProgress),
        ]);

        const snapshotFromCloud = await fetchCloudSnapshot(deviceId);
        if (snapshotFromCloud) {
          if (snapshotFromCloud.bookmarks?.length) {
            const mergedBookmarks = mergeCloudBookmarks(
              snapshot.bookmarks,
              snapshotFromCloud.bookmarks,
            );
            setBookmarks(mergedBookmarks);
            await saveBookmarks(mergedBookmarks);
          }

          if (
            snapshotFromCloud.settings &&
            snapshotFromCloud.settings.updatedAt > snapshot.preferences.updatedAt
          ) {
            const mergedPreferences: ReaderPreferences = {
              ...snapshot.preferences,
              showTranslation: snapshotFromCloud.settings.showTranslation,
              arabicFontSize: snapshotFromCloud.settings.arabicFontSize,
              translationFontSize: snapshotFromCloud.settings.translationFontSize,
              dailyAyahGoal: snapshotFromCloud.settings.dailyAyahGoal,
              updatedAt: snapshotFromCloud.settings.updatedAt,
            };
            setPreferences(mergedPreferences);
            await savePreferences(mergedPreferences);
          }

          if (snapshotFromCloud.readingProgress?.length) {
            const latest = [...snapshotFromCloud.readingProgress].sort(
              (a, b) => b.updatedAt - a.updatedAt,
            )[0];

            if (latest && latest.updatedAt > snapshot.readingProgress.updatedAt) {
              const mergedProgress: ReadingProgress = {
                lastSurahId: latest.surahId,
                lastAyahNumber: latest.lastAyahRead,
                totalAyahsRead: Math.max(
                  snapshot.readingProgress.totalAyahsRead,
                  latest.totalAyahsRead,
                ),
                updatedAt: latest.updatedAt,
              };
              setReadingProgress(mergedProgress);
              await saveReadingProgress(mergedProgress);
            }
          }
        }

        setSyncStatus("success");
        setLastSyncedAt(Date.now());
      } catch (unknownError) {
        const message =
          unknownError instanceof Error ? unknownError.message : "Sync failed";
        setSyncError(message);
        setSyncStatus("error");
      }
    },
    [deviceId],
  );

  const syncNow = useCallback(async () => {
    if (!isBackendEnabled || !deviceId) {
      setSyncStatus("disabled");
      return;
    }
    await syncSnapshot({
      bookmarks,
      preferences,
      readingProgress,
    });
  }, [bookmarks, deviceId, preferences, readingProgress, syncSnapshot]);

  useEffect(() => {
    if (!isHydrated || !deviceId || !isBackendEnabled) return;
    if (initialSyncDoneRef.current) return;

    initialSyncDoneRef.current = true;
    void syncNow();
  }, [deviceId, isHydrated, syncNow]);

  const toggleBookmark = useCallback(
    (surahId: number, surahName: string, ayahNumber: number, ayahText?: string) => {
      const now = Date.now();

      setBookmarks((current) => {
        const existing = current.find(
          (bookmark) =>
            bookmark.surahId === surahId && bookmark.ayahNumber === ayahNumber,
        );

        let next: BookmarkEntry[];
        if (existing) {
          next = current.filter(
            (bookmark) =>
              !(
                bookmark.surahId === surahId && bookmark.ayahNumber === ayahNumber
              ),
          );
          if (deviceId && isBackendEnabled) {
            void deleteBookmarkFromCloud(deviceId, surahId, ayahNumber);
          }
        } else {
          next = [
            ...current,
            {
              surahId,
              surahName,
              ayahNumber,
              ayahText,
              createdAt: now,
              updatedAt: now,
            },
          ];
        }

        const sorted = [...next].sort((a, b) => b.updatedAt - a.updatedAt);
        void saveBookmarks(sorted);
        if (!existing && isBackendEnabled && deviceId) {
          void syncSnapshot({
            bookmarks: sorted,
            preferences,
            readingProgress,
          });
        }
        return sorted;
      });
    },
    [deviceId, preferences, readingProgress, syncSnapshot],
  );

  const isBookmarked = useCallback(
    (surahId: number, ayahNumber: number) =>
      bookmarks.some(
        (bookmark) =>
          bookmark.surahId === surahId && bookmark.ayahNumber === ayahNumber,
      ),
    [bookmarks],
  );

  const updatePreferences = useCallback(
    (updates: Partial<ReaderPreferences>) => {
      setPreferences((current) => {
        const next = {
          ...current,
          ...updates,
          updatedAt: Date.now(),
        };
        void savePreferences(next);
        if (isBackendEnabled && deviceId) {
          void syncSnapshot({
            bookmarks,
            preferences: next,
            readingProgress,
          });
        }
        return next;
      });
    },
    [bookmarks, deviceId, readingProgress, syncSnapshot],
  );

  const recordReadingPosition = useCallback(
    (surahId: number, ayahNumber: number) => {
      setReadingProgress((current) => {
        const next: ReadingProgress = {
          lastSurahId: surahId,
          lastAyahNumber: ayahNumber,
          totalAyahsRead:
            current.lastSurahId === surahId && current.lastAyahNumber === ayahNumber
              ? current.totalAyahsRead
              : current.totalAyahsRead + 1,
          updatedAt: Date.now(),
        };
        void saveReadingProgress(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      isHydrated,
      deviceId,
      backendEnabled: isBackendEnabled,
      bookmarks,
      preferences,
      readingProgress,
      syncStatus,
      syncError,
      lastSyncedAt,
      toggleBookmark,
      isBookmarked,
      updatePreferences,
      recordReadingPosition,
      syncNow,
    }),
    [
      bookmarks,
      deviceId,
      isBookmarked,
      isHydrated,
      lastSyncedAt,
      preferences,
      readingProgress,
      syncError,
      syncNow,
      syncStatus,
      toggleBookmark,
      updatePreferences,
      recordReadingPosition,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }
  return context;
}
