import { db } from './index'
import type { HifzProgress } from './types'
import {
  calculateSM2,
  confidenceToQuality,
  nextReviewDate,
} from '../spaced-repetition'

export async function markVerse(data: {
  verseKey: string
  chapterId: number
  verseNumber: number
  confidence: 'new' | 'learning' | 'shaky' | 'good' | 'solid'
}): Promise<string> {
  const existing = await db.hifzProgress.where('verseKey').equals(data.verseKey).first()
  if (existing) {
    await updateAfterReview(existing.id, data.confidence)
    return existing.id
  }

  const now = Date.now()
  const quality = confidenceToQuality(data.confidence)
  const sm2 = calculateSM2(quality, 2.5, 0, 0)

  const id = crypto.randomUUID()
  await db.hifzProgress.add({
    id,
    verseKey: data.verseKey,
    chapterId: data.chapterId,
    verseNumber: data.verseNumber,
    confidence: data.confidence,
    lastReviewedAt: now,
    nextReviewAt: nextReviewDate(sm2.interval),
    reviewCount: 1,
    easeFactor: sm2.easeFactor,
    interval: sm2.interval,
    streak: quality >= 2 ? 1 : 0,
    createdAt: now,
    updatedAt: now,
  })
  return id
}

export async function getVerseProgress(
  verseKey: string
): Promise<HifzProgress | undefined> {
  return db.hifzProgress.where('verseKey').equals(verseKey).first()
}

export async function getDueReviews(limit?: number): Promise<HifzProgress[]> {
  const now = Date.now()
  let query = db.hifzProgress
    .where('nextReviewAt')
    .belowOrEqual(now)
    .sortBy('nextReviewAt')

  if (limit !== undefined) {
    query = query.then((items) => items.slice(0, limit))
  }
  return query
}

export async function updateAfterReview(
  id: string,
  confidence: 'new' | 'learning' | 'shaky' | 'good' | 'solid'
): Promise<void> {
  const entry = await db.hifzProgress.get(id)
  if (!entry) return

  const quality = confidenceToQuality(confidence)
  const sm2 = calculateSM2(quality, entry.easeFactor, entry.interval, entry.streak)
  const now = Date.now()

  await db.hifzProgress.update(id, {
    confidence,
    lastReviewedAt: now,
    nextReviewAt: nextReviewDate(sm2.interval),
    reviewCount: entry.reviewCount + 1,
    easeFactor: sm2.easeFactor,
    interval: sm2.interval,
    streak: quality >= 2 ? entry.streak + 1 : 0,
    updatedAt: now,
  })
}

export async function getChapterProgress(chapterId: number): Promise<{
  total: number
  new: number
  learning: number
  shaky: number
  good: number
  solid: number
}> {
  const verses = await db.hifzProgress
    .where('chapterId')
    .equals(chapterId)
    .toArray()

  const counts = { total: verses.length, new: 0, learning: 0, shaky: 0, good: 0, solid: 0 }
  for (const v of verses) {
    counts[v.confidence]++
  }
  return counts
}

export async function getTotalProgress(): Promise<{
  total: number
  memorized: number
  learning: number
  new: number
}> {
  const all = await db.hifzProgress.toArray()
  let memorized = 0
  let learning = 0
  let newCount = 0

  for (const v of all) {
    if (v.confidence === 'good' || v.confidence === 'solid') {
      memorized++
    } else if (v.confidence === 'learning' || v.confidence === 'shaky') {
      learning++
    } else {
      newCount++
    }
  }

  return {
    total: 6236,
    memorized,
    learning,
    new: newCount,
  }
}

export async function getDailyReviewCount(date?: Date): Promise<number> {
  const d = date ?? new Date()
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000

  const reviews = await db.hifzProgress
    .filter((entry) => {
      return (
        entry.lastReviewedAt !== undefined &&
        entry.lastReviewedAt >= startOfDay &&
        entry.lastReviewedAt < endOfDay
      )
    })
    .count()

  return reviews
}

export async function getStreak(): Promise<number> {
  const all = await db.hifzProgress
    .filter((e) => e.lastReviewedAt !== undefined)
    .toArray()

  if (all.length === 0) return 0

  // Collect unique days that had reviews
  const reviewDays = new Set<string>()
  for (const entry of all) {
    if (entry.lastReviewedAt) {
      const d = new Date(entry.lastReviewedAt)
      reviewDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
    }
  }

  // Count backwards from today
  let streak = 0
  const now = new Date()
  let current = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Check if today has reviews; if not, start from yesterday
  const todayKey = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`
  if (!reviewDays.has(todayKey)) {
    current = new Date(current.getTime() - 24 * 60 * 60 * 1000)
  }

  while (true) {
    const key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`
    if (reviewDays.has(key)) {
      streak++
      current = new Date(current.getTime() - 24 * 60 * 60 * 1000)
    } else {
      break
    }
  }

  return streak
}
