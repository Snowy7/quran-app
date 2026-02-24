import { useCallback, useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useConvex } from "convex/react";
import { FunctionReference } from "convex/server";
import { db } from "@/lib/db";
import type { Bookmark, SurahMemorization, UserSettings } from "@/types/quran";

// Dynamic function references - these will be available once Convex dev server runs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api: any = {
  quranSync: {
    syncReadingProgress:
      "quranSync:syncReadingProgress" as unknown as FunctionReference<"mutation">,
    syncBookmarks:
      "quranSync:syncBookmarks" as unknown as FunctionReference<"mutation">,
    syncMemorization:
      "quranSync:syncMemorization" as unknown as FunctionReference<"mutation">,
    syncSettings:
      "quranSync:syncSettings" as unknown as FunctionReference<"mutation">,
    getAllUserData:
      "quranSync:getAllUserData" as unknown as FunctionReference<"query">,
  },
};

export type SyncStatus = "idle" | "syncing" | "success" | "error" | "offline";

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  itemsSynced: number;
}

export function useConvexSync() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const convex = useConvex();
  const [syncState, setSyncState] = useState<SyncState>({
    status: "idle",
    lastSyncedAt: null,
    error: null,
    itemsSynced: 0,
  });

  const clerkId = user?.id;

  // Sync reading progress from local to cloud
  const syncReadingProgressToCloud = useCallback(async () => {
    if (!clerkId) return 0;

    const localProgress = await db.readingProgress.toArray();
    if (localProgress.length === 0) return 0;

    // Get current reading position for each surah we've visited
    const history = await db.readingHistory.toArray();
    const surahProgress: Record<
      number,
      { lastAyahRead: number; totalAyahsRead: number; lastReadAt: number }
    > = {};

    for (const entry of history) {
      for (const ayah of entry.ayahsRead) {
        if (!surahProgress[ayah.surahId]) {
          surahProgress[ayah.surahId] = {
            lastAyahRead: ayah.ayahNumber,
            totalAyahsRead: 0,
            lastReadAt: ayah.timestamp,
          };
        }
        surahProgress[ayah.surahId].totalAyahsRead++;
        if (ayah.timestamp > surahProgress[ayah.surahId].lastReadAt) {
          surahProgress[ayah.surahId].lastReadAt = ayah.timestamp;
          surahProgress[ayah.surahId].lastAyahRead = ayah.ayahNumber;
        }
      }
    }

    const progressData = Object.entries(surahProgress).map(
      ([surahId, data]) => ({
        surahId: parseInt(surahId),
        lastAyahRead: data.lastAyahRead,
        totalAyahsRead: data.totalAyahsRead,
        lastReadAt: data.lastReadAt,
        updatedAt: Date.now(),
      }),
    );

    if (progressData.length === 0) return 0;

    await convex.mutation(api.quranSync.syncReadingProgress, {
      clerkId,
      progress: progressData,
    });

    return progressData.length;
  }, [clerkId, convex]);

  // Sync bookmarks from local to cloud
  const syncBookmarksToCloud = useCallback(async () => {
    if (!clerkId) return 0;

    const localBookmarks = await db.bookmarks
      .filter((b) => !b.isDeleted)
      .toArray();
    if (localBookmarks.length === 0) return 0;

    const bookmarkData = localBookmarks.map((b) => ({
      surahId: b.surahId,
      ayahNumber: b.ayahNumber,
      note: b.label,
      color: b.color,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    await convex.mutation(api.quranSync.syncBookmarks, {
      clerkId,
      bookmarks: bookmarkData,
    });

    return bookmarkData.length;
  }, [clerkId, convex]);

  // Sync memorization from local to cloud
  const syncMemorizationToCloud = useCallback(async () => {
    if (!clerkId) return 0;

    const localMem = await db.memorization.toArray();
    if (localMem.length === 0) return 0;

    // Convert surah memorization to individual ayah records
    const memItems: Array<{
      surahId: number;
      ayahNumber: number;
      status: string;
      confidenceLevel: number;
      lastReviewedAt?: number;
      nextReviewAt?: number;
      reviewCount: number;
      createdAt: number;
      updatedAt: number;
    }> = [];

    for (const surah of localMem) {
      for (const ayahNum of surah.memorizedAyahs) {
        memItems.push({
          surahId: surah.surahId,
          ayahNumber: ayahNum,
          status: surah.status,
          confidenceLevel: 3, // Default confidence
          lastReviewedAt: surah.lastRevisedAt,
          nextReviewAt: surah.nextRevisionAt,
          reviewCount: surah.revisionCount,
          createdAt: surah.startedAt || Date.now(),
          updatedAt: surah.updatedAt,
        });
      }
    }

    if (memItems.length === 0) return 0;

    await convex.mutation(api.quranSync.syncMemorization, {
      clerkId,
      items: memItems,
    });

    return memItems.length;
  }, [clerkId, convex]);

  // Sync settings from local to cloud
  const syncSettingsToCloud = useCallback(async () => {
    if (!clerkId) return 0;

    const localSettings = await db.settings.get("current");
    if (!localSettings) return 0;

    await convex.mutation(api.quranSync.syncSettings, {
      clerkId,
      settings: {
        theme: localSettings.theme,
        arabicFontSize: localSettings.arabicFontSize,
        translationFontSize: localSettings.translationFontSize,
        showTranslation: localSettings.showTranslation,
        preferredReciter: localSettings.defaultReciterId,
        preferredTranslation: localSettings.primaryTranslation,
        playbackSpeed: localSettings.playbackSpeed,
        autoPlayNext: localSettings.autoPlayNext,
        dailyAyahGoal: localSettings.dailyAyahGoal,
        updatedAt: localSettings.lastSyncedAt || Date.now(),
      },
    });

    return 1;
  }, [clerkId, convex]);

  // Pull data from cloud to local
  const pullFromCloud = useCallback(async () => {
    if (!clerkId) return 0;

    const cloudData = await convex.query(api.quranSync.getAllUserData, {
      clerkId,
    });
    let itemsUpdated = 0;

    // Merge bookmarks from cloud
    for (const cloudBookmark of cloudData.bookmarks) {
      const localBookmark = await db.bookmarks
        .where({
          surahId: cloudBookmark.surahId,
          ayahNumber: cloudBookmark.ayahNumber,
        })
        .first();

      if (!localBookmark || cloudBookmark.updatedAt > localBookmark.updatedAt) {
        const newBookmark: Bookmark = {
          clientId: localBookmark?.clientId || crypto.randomUUID(),
          surahId: cloudBookmark.surahId,
          ayahNumber: cloudBookmark.ayahNumber,
          label: cloudBookmark.note,
          color: cloudBookmark.color,
          createdAt: cloudBookmark.createdAt,
          updatedAt: cloudBookmark.updatedAt,
          isDeleted: false,
          version: (localBookmark?.version || 0) + 1,
          isDirty: false,
        };
        await db.bookmarks.put(newBookmark);
        itemsUpdated++;
      }
    }

    // Merge memorization from cloud
    const memBySurah: Record<
      number,
      {
        ayahs: number[];
        lastUpdated: number;
        data: (typeof cloudData.memorization)[0];
      }
    > = {};
    for (const mem of cloudData.memorization) {
      if (!memBySurah[mem.surahId]) {
        memBySurah[mem.surahId] = { ayahs: [], lastUpdated: 0, data: mem };
      }
      memBySurah[mem.surahId].ayahs.push(mem.ayahNumber);
      if (mem.updatedAt > memBySurah[mem.surahId].lastUpdated) {
        memBySurah[mem.surahId].lastUpdated = mem.updatedAt;
        memBySurah[mem.surahId].data = mem;
      }
    }

    for (const [surahIdStr, data] of Object.entries(memBySurah)) {
      const surahId = parseInt(surahIdStr);
      const localMem = await db.memorization.get(surahId);

      if (!localMem || data.lastUpdated > localMem.updatedAt) {
        const newMem: SurahMemorization = {
          surahId,
          status: data.data.status as
            | "not_started"
            | "learning"
            | "memorized"
            | "needs_revision",
          memorizedAyahs: data.ayahs,
          lastRevisedAt: data.data.lastReviewedAt,
          nextRevisionAt: data.data.nextReviewAt,
          revisionCount: data.data.reviewCount,
          startedAt: data.data.createdAt,
          updatedAt: data.lastUpdated,
          version: (localMem?.version || 0) + 1,
          isDirty: false,
        };
        await db.memorization.put(newMem);
        itemsUpdated++;
      }
    }

    // Merge settings from cloud
    if (cloudData.settings) {
      const localSettings = await db.settings.get("current");
      if (
        !localSettings ||
        cloudData.settings.updatedAt > (localSettings.lastSyncedAt || 0)
      ) {
        const newSettings: UserSettings = {
          id: "current",
          theme: cloudData.settings.theme as "light" | "dark" | "system",
          arabicFontSize: cloudData.settings.arabicFontSize,
          arabicFontFamily: localSettings?.arabicFontFamily || "amiri",
          textColorMode: localSettings?.textColorMode || "default",
          readingWidth: localSettings?.readingWidth || 70,
          lineHeight: localSettings?.lineHeight || 2.4,
          wordSpacing: localSettings?.wordSpacing || 2,
          letterSpacing: localSettings?.letterSpacing || 0,
          translationFontSize: cloudData.settings.translationFontSize,
          showTranslation: cloudData.settings.showTranslation,
          showTajweed: localSettings?.showTajweed || false,
          readingMode: localSettings?.readingMode || "scroll",
          defaultReciterId: cloudData.settings.preferredReciter,
          playbackSpeed: cloudData.settings.playbackSpeed,
          autoPlayNext: cloudData.settings.autoPlayNext,
          primaryTranslation: cloudData.settings.preferredTranslation,
          secondaryTranslation: localSettings?.secondaryTranslation,
          showTafsir: localSettings?.showTafsir || false,
          primaryTafsir: localSettings?.primaryTafsir || 16,
          dailyReminderEnabled: localSettings?.dailyReminderEnabled || false,
          dailyReminderTime: localSettings?.dailyReminderTime || "08:00",
          revisionRemindersEnabled:
            localSettings?.revisionRemindersEnabled || false,
          streakRemindersEnabled:
            localSettings?.streakRemindersEnabled || false,
          dailyAyahGoal: cloudData.settings.dailyAyahGoal,
          dailyTimeGoalMinutes: localSettings?.dailyTimeGoalMinutes || 30,
          lastSyncedAt: Date.now(),
          version: (localSettings?.version || 0) + 1,
          isDirty: false,
        };
        await db.settings.put(newSettings);
        itemsUpdated++;
      }
    }

    return itemsUpdated;
  }, [clerkId, convex]);

  // Full bidirectional sync
  const syncAll = useCallback(async () => {
    if (!isSignedIn || !clerkId) {
      setSyncState((prev) => ({ ...prev, status: "idle" }));
      return;
    }

    if (!navigator.onLine) {
      setSyncState((prev) => ({ ...prev, status: "offline" }));
      return;
    }

    setSyncState((prev) => ({ ...prev, status: "syncing", error: null }));

    try {
      // Push local changes to cloud
      const progressCount = await syncReadingProgressToCloud();
      const bookmarkCount = await syncBookmarksToCloud();
      const memCount = await syncMemorizationToCloud();
      const settingsCount = await syncSettingsToCloud();

      // Pull cloud changes to local
      const pullCount = await pullFromCloud();

      const totalItems =
        progressCount + bookmarkCount + memCount + settingsCount + pullCount;

      setSyncState({
        status: "success",
        lastSyncedAt: Date.now(),
        error: null,
        itemsSynced: totalItems,
      });

      // Update local settings with sync timestamp
      const settings = await db.settings.get("current");
      if (settings) {
        await db.settings.update("current", { lastSyncedAt: Date.now() });
      }
    } catch (error) {
      console.error("[Sync] Error:", error);
      setSyncState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Sync failed",
      }));
    }
  }, [
    isSignedIn,
    clerkId,
    syncReadingProgressToCloud,
    syncBookmarksToCloud,
    syncMemorizationToCloud,
    syncSettingsToCloud,
    pullFromCloud,
  ]);

  // Track if auto-sync has been initialized to prevent duplicate intervals
  const syncInitializedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-sync on sign in and periodically
  useEffect(() => {
    if (isSignedIn && clerkId) {
      // Only initialize once per session
      if (!syncInitializedRef.current) {
        syncInitializedRef.current = true;
        // Initial sync
        syncAll();
      }

      // Clear any existing interval before setting a new one
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Sync every 5 minutes
      intervalRef.current = setInterval(syncAll, 5 * 60 * 1000);

      // Sync when coming online
      const handleOnline = () => syncAll();
      window.addEventListener("online", handleOnline);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        window.removeEventListener("online", handleOnline);
      };
    } else {
      // Reset initialization flag when signed out
      syncInitializedRef.current = false;
    }
  }, [isSignedIn, clerkId, syncAll]);

  return {
    ...syncState,
    syncAll,
    isSignedIn: isSignedIn ?? false,
  };
}
