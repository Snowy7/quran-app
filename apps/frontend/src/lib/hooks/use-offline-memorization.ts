import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { SurahMemorization, MemorizationStatus } from '@/types/quran';
import { SURAHS } from '@/data/surahs';

export function useOfflineMemorization() {
  const memorizations = useLiveQuery(() => db.memorization.toArray(), []);

  const getMemorizationStatus = async (surahId: number): Promise<SurahMemorization | undefined> => {
    return db.memorization.get(surahId);
  };

  const updateMemorizationStatus = async (
    surahId: number,
    status: MemorizationStatus
  ): Promise<SurahMemorization> => {
    const existing = await db.memorization.get(surahId);
    const now = Date.now();

    const updated: SurahMemorization = {
      surahId,
      status,
      memorizedAyahs: existing?.memorizedAyahs || [],
      lastRevisedAt: status === 'needs_revision' ? existing?.lastRevisedAt : now,
      nextRevisionAt: calculateNextRevision(status, existing?.revisionCount || 0),
      revisionCount: status === 'needs_revision' ? (existing?.revisionCount || 0) : existing?.revisionCount || 0,
      notes: existing?.notes,
      startedAt: existing?.startedAt || (status !== 'not_started' ? now : undefined),
      completedAt: status === 'memorized' && !existing?.completedAt ? now : existing?.completedAt,
      updatedAt: now,
      version: (existing?.version || 0) + 1,
      isDirty: true,
    };

    await db.memorization.put(updated);
    return updated;
  };

  const markAyahMemorized = async (surahId: number, ayahNumber: number): Promise<void> => {
    const existing = await db.memorization.get(surahId);
    const now = Date.now();

    const memorizedAyahs = existing?.memorizedAyahs || [];
    if (!memorizedAyahs.includes(ayahNumber)) {
      memorizedAyahs.push(ayahNumber);
      memorizedAyahs.sort((a, b) => a - b);
    }

    const surah = SURAHS.find((s) => s.id === surahId);
    const isComplete = surah && memorizedAyahs.length === surah.numberOfAyahs;

    const updated: SurahMemorization = {
      surahId,
      status: isComplete ? 'memorized' : 'learning',
      memorizedAyahs,
      lastRevisedAt: existing?.lastRevisedAt,
      nextRevisionAt: existing?.nextRevisionAt,
      revisionCount: existing?.revisionCount || 0,
      notes: existing?.notes,
      startedAt: existing?.startedAt || now,
      completedAt: isComplete ? now : undefined,
      updatedAt: now,
      version: (existing?.version || 0) + 1,
      isDirty: true,
    };

    await db.memorization.put(updated);
  };

  const unmarkAyahMemorized = async (surahId: number, ayahNumber: number): Promise<void> => {
    const existing = await db.memorization.get(surahId);
    if (!existing) return;

    const memorizedAyahs = existing.memorizedAyahs.filter((a) => a !== ayahNumber);
    const now = Date.now();

    const updated: SurahMemorization = {
      ...existing,
      memorizedAyahs,
      status: memorizedAyahs.length === 0 ? 'not_started' : 'learning',
      completedAt: undefined, // No longer complete
      updatedAt: now,
      version: existing.version + 1,
      isDirty: true,
    };

    await db.memorization.put(updated);
  };

  const recordRevision = async (surahId: number): Promise<void> => {
    const existing = await db.memorization.get(surahId);
    if (!existing) return;

    const now = Date.now();
    const revisionCount = existing.revisionCount + 1;

    const updated: SurahMemorization = {
      ...existing,
      lastRevisedAt: now,
      nextRevisionAt: calculateNextRevision(existing.status, revisionCount),
      revisionCount,
      status: 'memorized', // After revision, mark as memorized again
      updatedAt: now,
      version: existing.version + 1,
      isDirty: true,
    };

    await db.memorization.put(updated);
  };

  const updateNotes = async (surahId: number, notes: string): Promise<void> => {
    const existing = await db.memorization.get(surahId);
    const now = Date.now();

    const updated: SurahMemorization = {
      surahId,
      status: existing?.status || 'not_started',
      memorizedAyahs: existing?.memorizedAyahs || [],
      lastRevisedAt: existing?.lastRevisedAt,
      nextRevisionAt: existing?.nextRevisionAt,
      revisionCount: existing?.revisionCount || 0,
      notes,
      startedAt: existing?.startedAt,
      completedAt: existing?.completedAt,
      updatedAt: now,
      version: (existing?.version || 0) + 1,
      isDirty: true,
    };

    await db.memorization.put(updated);
  };

  // Calculate stats
  const stats = {
    totalSurahs: 114,
    memorized: memorizations?.filter((m) => m.status === 'memorized').length || 0,
    learning: memorizations?.filter((m) => m.status === 'learning').length || 0,
    needsRevision: memorizations?.filter((m) => m.status === 'needs_revision').length || 0,
    notStarted: 114 - (memorizations?.length || 0),
  };

  return {
    memorizations: memorizations || [],
    getMemorizationStatus,
    updateMemorizationStatus,
    markAyahMemorized,
    unmarkAyahMemorized,
    recordRevision,
    updateNotes,
    stats,
    isLoading: memorizations === undefined,
  };
}

// Spaced repetition intervals (in milliseconds)
function calculateNextRevision(status: MemorizationStatus, revisionCount: number): number | undefined {
  if (status !== 'memorized') return undefined;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // Simple spaced repetition: 1, 3, 7, 14, 30, 60 days
  const intervals = [1, 3, 7, 14, 30, 60, 90, 180, 365];
  const interval = intervals[Math.min(revisionCount, intervals.length - 1)];

  return now + interval * day;
}

// Hook for getting memorization for a specific surah
export function useSurahMemorization(surahId: number) {
  const memorization = useLiveQuery(
    () => db.memorization.get(surahId),
    [surahId]
  );

  const surah = SURAHS.find((s) => s.id === surahId);
  const totalAyahs = surah?.numberOfAyahs || 0;
  const memorizedCount = memorization?.memorizedAyahs.length || 0;
  const percentage = totalAyahs > 0 ? (memorizedCount / totalAyahs) * 100 : 0;

  return {
    memorization,
    status: memorization?.status || 'not_started',
    memorizedCount,
    totalAyahs,
    percentage,
    isLoading: memorization === undefined,
  };
}

// Hook for getting surahs that need revision
export function useRevisionReminders() {
  const now = Date.now();

  const dueForRevision = useLiveQuery(
    () =>
      db.memorization
        .where('nextRevisionAt')
        .belowOrEqual(now)
        .and((m) => m.status === 'memorized' || m.status === 'needs_revision')
        .toArray(),
    []
  );

  return {
    dueForRevision: dueForRevision || [],
    count: dueForRevision?.length || 0,
    isLoading: dueForRevision === undefined,
  };
}
