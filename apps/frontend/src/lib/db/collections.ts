import { db } from './index'
import type { Collection } from './types'

export async function createCollection(data: {
  name: string
  description?: string
  color: string
  icon?: string
}): Promise<string> {
  const now = Date.now()
  const maxOrder = await db.collections.orderBy('sortOrder').last()
  const sortOrder = maxOrder ? maxOrder.sortOrder + 1 : 0

  const id = crypto.randomUUID()
  await db.collections.add({
    id,
    name: data.name,
    description: data.description,
    color: data.color,
    icon: data.icon,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  })
  return id
}

export async function getCollections(): Promise<Collection[]> {
  return db.collections.orderBy('sortOrder').toArray()
}

export async function getCollection(id: string): Promise<Collection | undefined> {
  return db.collections.get(id)
}

export async function updateCollection(
  id: string,
  data: Partial<Pick<Collection, 'name' | 'description' | 'color' | 'icon'>>
): Promise<void> {
  await db.collections.update(id, {
    ...data,
    updatedAt: Date.now(),
  })
}

export async function deleteCollection(id: string): Promise<void> {
  await db.transaction('rw', db.collections, db.bookmarks, async () => {
    await db.bookmarks.where('collectionId').equals(id).delete()
    await db.collections.delete(id)
  })
}

export async function reorderCollections(orderedIds: string[]): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.collections, async () => {
    const updates = orderedIds.map((id, index) =>
      db.collections.update(id, { sortOrder: index, updatedAt: now })
    )
    await Promise.all(updates)
  })
}
