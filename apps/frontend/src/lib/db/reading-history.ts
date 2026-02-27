import { db } from "./index";
import type { ReadingHistoryEntry } from "./types";

export async function saveReadingPosition(
  chapterId: number,
  verseNumber: number,
  readingMode: "translation" | "mushaf" | "word-by-word" | "tafsir",
): Promise<void> {
  const now = Date.now();

  // Find an existing entry for this chapter to upsert
  const existing = await db.readingHistory
    .where("chapterId")
    .equals(chapterId)
    .sortBy("timestamp")
    .then((items) => (items.length > 0 ? items[items.length - 1] : undefined));

  if (existing) {
    await db.readingHistory.update(existing.id, {
      verseNumber,
      readingMode,
      timestamp: now,
    });
  } else {
    await db.readingHistory.add({
      id: crypto.randomUUID(),
      chapterId,
      verseNumber,
      readingMode,
      timestamp: now,
    });
  }
}

export async function getLastRead(): Promise<ReadingHistoryEntry | undefined> {
  return db.readingHistory.orderBy("timestamp").last();
}

export async function getReadingHistory(
  limit = 20,
): Promise<ReadingHistoryEntry[]> {
  return db.readingHistory
    .orderBy("timestamp")
    .reverse()
    .limit(limit)
    .toArray();
}
