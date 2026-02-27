export interface SM2Result {
  easeFactor: number
  interval: number
  repetitions: number
}

/**
 * SM-2 spaced repetition algorithm.
 *
 * @param quality - 0=forgot, 1=shaky, 2=good, 3=solid
 * @param easeFactor - Current ease factor (starts at 2.5)
 * @param interval - Current interval in days
 * @param repetitions - Number of consecutive successful reviews
 */
export function calculateSM2(
  quality: number,
  easeFactor: number,
  interval: number,
  repetitions: number
): SM2Result {
  let newEF = easeFactor
  let newInterval = interval
  let newReps = repetitions

  if (quality === 0) {
    // Forgot: reset to beginning
    newReps = 0
    newInterval = 1
    newEF = Math.max(1.3, easeFactor - 0.2)
  } else if (quality === 1) {
    // Shaky: short interval, slight ease decrease
    newReps = 0
    newInterval = Math.max(1, Math.min(3, Math.round(interval * 0.5)))
    newEF = Math.max(1.3, easeFactor - 0.15)
  } else if (quality === 2) {
    // Good: normal progression
    newReps = repetitions + 1
    if (newReps === 1) {
      newInterval = 1
    } else if (newReps === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * easeFactor)
    }
    newEF = Math.max(1.3, easeFactor + 0.0)
  } else if (quality === 3) {
    // Solid: bonus interval, slight ease increase
    newReps = repetitions + 1
    if (newReps === 1) {
      newInterval = 2
    } else if (newReps === 2) {
      newInterval = 7
    } else {
      newInterval = Math.round(interval * easeFactor * 1.2)
    }
    newEF = Math.max(1.3, easeFactor + 0.1)
  }

  return {
    easeFactor: newEF,
    interval: newInterval,
    repetitions: newReps,
  }
}

const QUALITY_MAP: Record<string, number> = {
  new: 0,
  learning: 1,
  shaky: 1,
  good: 2,
  solid: 3,
}

/**
 * Map a confidence label to an SM-2 quality score.
 */
export function confidenceToQuality(
  confidence: 'new' | 'learning' | 'shaky' | 'good' | 'solid'
): number {
  return QUALITY_MAP[confidence] ?? 0
}

/**
 * Calculate the next review date from an interval in days.
 */
export function nextReviewDate(intervalDays: number): number {
  return Date.now() + intervalDays * 24 * 60 * 60 * 1000
}
