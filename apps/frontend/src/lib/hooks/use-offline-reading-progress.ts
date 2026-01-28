import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_READING_PROGRESS, getTodayDateString } from '@/lib/db';
import type { ReadingProgress, ReadingHistory } from '@/types/quran';

export function useOfflineReadingProgress() {
  const progress = useLiveQuery(
    () => db.readingProgress.get('current'),
    [],
    DEFAULT_READING_PROGRESS
  );

  const updatePosition = async (surahId: number, ayahNumber: number, scrollPosition?: number) => {
    const current = await db.readingProgress.get('current');
    const now = Date.now();
    const today = getTodayDateString();
    const lastReadDate = current?.lastReadDate;
    const lastReadDay = lastReadDate ? new Date(lastReadDate).toISOString().split('T')[0] : null;

    // Calculate streak
    let currentStreak = current?.currentStreak || 0;
    let longestStreak = current?.longestStreak || 0;

    if (lastReadDay !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastReadDay === yesterdayStr) {
        // Continuing streak from yesterday
        currentStreak += 1;
      } else if (lastReadDay !== today) {
        // Streak broken, start new
        currentStreak = 1;
      }

      longestStreak = Math.max(longestStreak, currentStreak);
    }

    const updated: ReadingProgress = {
      ...(current || DEFAULT_READING_PROGRESS),
      lastSurahId: surahId,
      lastAyahNumber: ayahNumber,
      lastScrollPosition: scrollPosition,
      updatedAt: now,
      lastReadDate: now,
      currentStreak,
      longestStreak,
      version: (current?.version || 0) + 1,
      isDirty: true,
    };

    await db.readingProgress.put(updated);
    return updated;
  };

  const recordAyahRead = async (surahId: number, ayahNumber: number) => {
    const today = getTodayDateString();
    const now = Date.now();

    // Update reading history for today
    let history = await db.readingHistory.get(today);
    if (!history) {
      history = {
        id: today,
        ayahsRead: [],
        totalAyahs: 0,
        totalTimeMs: 0,
        updatedAt: now,
        version: 1,
        isDirty: true,
      };
    }

    // Check if this ayah was already read today
    const alreadyRead = history.ayahsRead.some(
      (a) => a.surahId === surahId && a.ayahNumber === ayahNumber
    );

    if (!alreadyRead) {
      history.ayahsRead.push({ surahId, ayahNumber, timestamp: now });
      history.totalAyahs = history.ayahsRead.length;
      history.updatedAt = now;
      history.version += 1;
      history.isDirty = true;
      await db.readingHistory.put(history);

      // Update total ayahs read in progress
      const current = await db.readingProgress.get('current');
      if (current) {
        current.totalAyahsRead += 1;
        current.version += 1;
        current.isDirty = true;
        await db.readingProgress.put(current);
      }
    }
  };

  const addReadingTime = async (timeMs: number) => {
    const today = getTodayDateString();
    const now = Date.now();

    let history = await db.readingHistory.get(today);
    if (history) {
      history.totalTimeMs += timeMs;
      history.updatedAt = now;
      history.version += 1;
      history.isDirty = true;
      await db.readingHistory.put(history);
    }

    // Update total time in progress
    const current = await db.readingProgress.get('current');
    if (current) {
      current.totalTimeSpentMs += timeMs;
      current.version += 1;
      current.isDirty = true;
      await db.readingProgress.put(current);
    }
  };

  return {
    progress: progress || DEFAULT_READING_PROGRESS,
    updatePosition,
    recordAyahRead,
    addReadingTime,
    isLoading: progress === undefined,
  };
}

export function useReadingHistory(date?: string) {
  const targetDate = date || getTodayDateString();

  const history = useLiveQuery(
    () => db.readingHistory.get(targetDate),
    [targetDate]
  );

  return {
    history,
    isLoading: history === undefined,
  };
}
