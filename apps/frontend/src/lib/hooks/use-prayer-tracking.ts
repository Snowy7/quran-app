import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getTodayDateString } from '@/lib/db';
import type { PrayerLog, PrayerName } from '@/types/quran';

const DEFAULT_PRAYERS = {
  Fajr: { completed: false },
  Dhuhr: { completed: false },
  Asr: { completed: false },
  Maghrib: { completed: false },
  Isha: { completed: false },
};

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function usePrayerTracking() {
  const today = getTodayDateString();

  // Get today's prayer log
  const todayLog = useLiveQuery(
    () => db.prayerLogs.get(today),
    [today]
  );

  // Get prayer logs for a date range (for calendar view)
  const getLogsForMonth = useCallback(async (year: number, month: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const startStr = getDateString(startDate);
    const endStr = getDateString(endDate);

    return db.prayerLogs
      .where('id')
      .between(startStr, endStr, true, true)
      .toArray();
  }, []);

  // Toggle a prayer's completion status
  const togglePrayer = useCallback(async (prayer: PrayerName, date?: string) => {
    const dateStr = date || today;
    const existing = await db.prayerLogs.get(dateStr);

    const currentPrayers = existing?.prayers || { ...DEFAULT_PRAYERS };
    const isCurrentlyCompleted = currentPrayers[prayer]?.completed || false;

    const updatedPrayers = {
      ...currentPrayers,
      [prayer]: {
        completed: !isCurrentlyCompleted,
        completedAt: !isCurrentlyCompleted ? Date.now() : undefined,
      },
    };

    const log: PrayerLog = {
      id: dateStr,
      prayers: updatedPrayers as PrayerLog['prayers'],
      updatedAt: Date.now(),
      version: (existing?.version || 0) + 1,
      isDirty: true,
    };

    await db.prayerLogs.put(log);
  }, [today]);

  // Mark a prayer as completed
  const markPrayerCompleted = useCallback(async (prayer: PrayerName, date?: string) => {
    const dateStr = date || today;
    const existing = await db.prayerLogs.get(dateStr);

    const currentPrayers = existing?.prayers || { ...DEFAULT_PRAYERS };

    const updatedPrayers = {
      ...currentPrayers,
      [prayer]: {
        completed: true,
        completedAt: Date.now(),
      },
    };

    const log: PrayerLog = {
      id: dateStr,
      prayers: updatedPrayers as PrayerLog['prayers'],
      updatedAt: Date.now(),
      version: (existing?.version || 0) + 1,
      isDirty: true,
    };

    await db.prayerLogs.put(log);
  }, [today]);

  // Get completion stats
  const getStats = useCallback(async (days: number = 30) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await db.prayerLogs
      .where('id')
      .between(getDateString(startDate), getDateString(endDate), true, true)
      .toArray();

    let totalPrayers = 0;
    let completedPrayers = 0;
    const prayerCounts: Record<PrayerName, { total: number; completed: number }> = {
      Fajr: { total: 0, completed: 0 },
      Dhuhr: { total: 0, completed: 0 },
      Asr: { total: 0, completed: 0 },
      Maghrib: { total: 0, completed: 0 },
      Isha: { total: 0, completed: 0 },
    };

    for (const log of logs) {
      for (const [prayer, status] of Object.entries(log.prayers)) {
        const prayerName = prayer as PrayerName;
        totalPrayers++;
        prayerCounts[prayerName].total++;
        if (status.completed) {
          completedPrayers++;
          prayerCounts[prayerName].completed++;
        }
      }
    }

    return {
      totalDays: days,
      daysWithData: logs.length,
      totalPrayers,
      completedPrayers,
      completionRate: totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0,
      byPrayer: prayerCounts,
    };
  }, []);

  // Calculate streak (consecutive days with all 5 prayers)
  const getStreak = useCallback(async () => {
    const logs = await db.prayerLogs
      .orderBy('id')
      .reverse()
      .limit(365)
      .toArray();

    let streak = 0;
    const todayDate = new Date();

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(todayDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = getDateString(checkDate);

      const log = logs.find(l => l.id === dateStr);
      if (!log) {
        // No log for this day, streak ends (unless it's today)
        if (i === 0) continue;
        break;
      }

      const allCompleted = Object.values(log.prayers).every(p => p.completed);
      if (allCompleted) {
        streak++;
      } else if (i > 0) {
        // Not all completed and not today, streak ends
        break;
      }
    }

    return streak;
  }, []);

  // Get today's completion count
  const todayCompletedCount = todayLog?.prayers
    ? Object.values(todayLog.prayers).filter(p => p.completed).length
    : 0;

  return {
    todayLog,
    todayPrayers: todayLog?.prayers || DEFAULT_PRAYERS,
    todayCompletedCount,
    togglePrayer,
    markPrayerCompleted,
    getLogsForMonth,
    getStats,
    getStreak,
  };
}
