import Dexie from 'dexie'
import { db } from './index'
import type { Bookmark } from './types'

export async function addBookmark(data: {
  collectionId: string
  verseKey: string
  chapterId: number
  verseNumber: number
  note?: string
}): Promise<string> {
  const now = Date.now()
  const maxOrder = await db.bookmarks
    .where('collectionId')
    .equals(data.collectionId)
    .sortBy('sortOrder')
    .then((items) => (items.length > 0 ? items[items.length - 1].sortOrder : -1))

  const id = crypto.randomUUID()
  await db.bookmarks.add({
    id,
    collectionId: data.collectionId,
    verseKey: data.verseKey,
    chapterId: data.chapterId,
    verseNumber: data.verseNumber,
    note: data.note,
    sortOrder: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  })
  return id
}

export async function getBookmarksByCollection(collectionId: string): Promise<Bookmark[]> {
  return db.bookmarks
    .where('[collectionId+sortOrder]')
    .between([collectionId, Dexie.minKey], [collectionId, Dexie.maxKey])
    .toArray()
}

export async function getBookmarkByVerse(verseKey: string): Promise<Bookmark | undefined> {
  return db.bookmarks.where('verseKey').equals(verseKey).first()
}

export async function getBookmarkCollections(verseKey: string): Promise<string[]> {
  const bookmarks = await db.bookmarks.where('verseKey').equals(verseKey).toArray()
  return bookmarks.map((b) => b.collectionId)
}

export async function isVerseBookmarked(verseKey: string): Promise<boolean> {
  const count = await db.bookmarks.where('verseKey').equals(verseKey).count()
  return count > 0
}

export async function updateBookmark(
  id: string,
  data: Partial<Pick<Bookmark, 'note' | 'collectionId'>>
): Promise<void> {
  await db.bookmarks.update(id, {
    ...data,
    updatedAt: Date.now(),
  })
}

export async function removeBookmark(id: string): Promise<void> {
  await db.bookmarks.delete(id)
}

export async function reorderBookmarks(
  collectionId: string,
  orderedIds: string[]
): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.bookmarks, async () => {
    const updates = orderedIds.map((id, index) =>
      db.bookmarks.update(id, { sortOrder: index, updatedAt: now })
    )
    await Promise.all(updates)
  })
}
