import Dexie, { type Table } from 'dexie'
import type {
  Collection,
  Bookmark,
  HifzProgress,
  ReadingHistoryEntry,
  SettingEntry,
  ApiCacheEntry,
} from './types'

export class NoorDatabase extends Dexie {
  collections!: Table<Collection, string>
  bookmarks!: Table<Bookmark, string>
  hifzProgress!: Table<HifzProgress, string>
  readingHistory!: Table<ReadingHistoryEntry, string>
  settings!: Table<SettingEntry, string>
  apiCache!: Table<ApiCacheEntry, string>

  constructor() {
    super('NoorDB')

    this.version(1).stores({
      collections: 'id, sortOrder',
      bookmarks: 'id, collectionId, verseKey, chapterId, [collectionId+sortOrder]',
      hifzProgress:
        'id, verseKey, chapterId, confidence, nextReviewAt, [chapterId+verseNumber]',
      readingHistory: 'id, chapterId, timestamp',
      settings: 'key',
      apiCache: 'key, expiresAt',
    })
  }
}

export const db = new NoorDatabase()

export async function initializeDatabase(): Promise<void> {
  const collectionCount = await db.collections.count()
  if (collectionCount === 0) {
    const now = Date.now()
    await db.collections.bulkPut([
      {
        id: crypto.randomUUID(),
        name: 'Favorites',
        color: '#ef4444',
        icon: 'heart',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        name: 'To Review',
        color: '#3b82f6',
        icon: 'bookmark',
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
    ])
  }
}

export * from './types'
export * from './collections'
export * from './bookmarks'
export * from './hifz'
export * from './reading-history'
export * from './settings'
