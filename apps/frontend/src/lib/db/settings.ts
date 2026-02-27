import { db } from './index'

const DEFAULT_VALUES: Record<string, any> = {
  theme: 'system',
  arabicFontSize: 28,
  translationFontSize: 16,
  defaultTranslation: 'en.sahih',
  defaultReciter: 'Alafasy_128kbps',
  playbackSpeed: 1.0,
  autoPlayNext: true,
  dailyReviewGoal: 10,
  language: 'en',
}

export async function getSetting<T>(key: string, defaultValue?: T): Promise<T> {
  const entry = await db.settings.get(key)
  if (entry !== undefined) {
    return entry.value as T
  }
  if (defaultValue !== undefined) {
    return defaultValue
  }
  if (key in DEFAULT_VALUES) {
    return DEFAULT_VALUES[key] as T
  }
  return undefined as T
}

export async function setSetting(key: string, value: any): Promise<void> {
  await db.settings.put({ key, value })
}

export async function getAllSettings(): Promise<Record<string, any>> {
  const entries = await db.settings.toArray()
  const result: Record<string, any> = { ...DEFAULT_VALUES }
  for (const entry of entries) {
    result[entry.key] = entry.value
  }
  return result
}
