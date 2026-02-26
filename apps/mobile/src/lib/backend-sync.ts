import { ConvexHttpClient } from "convex/browser";
import { env } from "./env";
import type {
  BookmarkEntry,
  ReaderPreferences,
  ReadingProgress,
} from "../types/quran";

interface CloudSnapshot {
  bookmarks: Array<{
    surahId: number;
    ayahNumber: number;
    note?: string;
    color?: string;
    createdAt: number;
    updatedAt: number;
  }>;
  readingProgress: Array<{
    surahId: number;
    lastAyahRead: number;
    totalAyahsRead: number;
    lastReadAt: number;
    updatedAt: number;
  }>;
  settings?: {
    theme: string;
    arabicFontSize: number;
    translationFontSize: number;
    showTranslation: boolean;
    preferredReciter: string;
    preferredTranslation: string;
    playbackSpeed: number;
    autoPlayNext: boolean;
    dailyAyahGoal: number;
    updatedAt: number;
  };
}

const client = env.convexUrl ? new ConvexHttpClient(env.convexUrl) : null;
const unsafeClient = client as unknown as {
  mutation: (name: string, args: unknown) => Promise<unknown>;
  query: (name: string, args: unknown) => Promise<unknown>;
};

export const isBackendEnabled = Boolean(client);

export async function syncBookmarksToCloud(
  clerkId: string,
  bookmarks: BookmarkEntry[],
): Promise<void> {
  if (!client) return;

  await unsafeClient.mutation("quranSync:syncBookmarks", {
    clerkId,
    bookmarks: bookmarks.map((bookmark) => ({
      surahId: bookmark.surahId,
      ayahNumber: bookmark.ayahNumber,
      note: bookmark.note,
      color: bookmark.color,
      createdAt: bookmark.createdAt,
      updatedAt: bookmark.updatedAt,
    })),
  });
}

export async function deleteBookmarkFromCloud(
  clerkId: string,
  surahId: number,
  ayahNumber: number,
): Promise<void> {
  if (!client) return;

  await unsafeClient.mutation("quranSync:deleteBookmark", {
    clerkId,
    surahId,
    ayahNumber,
  });
}

export async function syncSettingsToCloud(
  clerkId: string,
  preferences: ReaderPreferences,
): Promise<void> {
  if (!client) return;

  await unsafeClient.mutation("quranSync:syncSettings", {
    clerkId,
    settings: {
      theme: "system",
      arabicFontSize: preferences.arabicFontSize,
      translationFontSize: preferences.translationFontSize,
      showTranslation: preferences.showTranslation,
      preferredReciter: "Abdul_Basit_Murattal_192kbps",
      preferredTranslation: "en.sahih",
      playbackSpeed: 1,
      autoPlayNext: true,
      dailyAyahGoal: preferences.dailyAyahGoal,
      updatedAt: preferences.updatedAt,
    },
  });
}

export async function syncReadingProgressToCloud(
  clerkId: string,
  readingProgress: ReadingProgress,
): Promise<void> {
  if (!client) return;

  await unsafeClient.mutation("quranSync:syncReadingProgress", {
    clerkId,
    progress: [
      {
        surahId: readingProgress.lastSurahId,
        lastAyahRead: readingProgress.lastAyahNumber,
        totalAyahsRead: readingProgress.totalAyahsRead,
        lastReadAt: readingProgress.updatedAt,
        updatedAt: readingProgress.updatedAt,
      },
    ],
  });
}

export async function fetchCloudSnapshot(
  clerkId: string,
): Promise<CloudSnapshot | null> {
  if (!client) return null;

  const result = await unsafeClient.query("quranSync:getAllUserData", {
    clerkId,
  });
  return result as CloudSnapshot;
}
