import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Heart, Plus, Check, FolderPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
} from '@template/ui';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';
import { addBookmark, getBookmarkCollections, removeBookmark } from '@/lib/db/bookmarks';
import { createCollection } from '@/lib/db/collections';

interface SaveToCollectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verseKey: string;
  chapterId: number;
  verseNumber: number;
}

export function SaveToCollection({
  open,
  onOpenChange,
  verseKey,
  chapterId,
  verseNumber,
}: SaveToCollectionProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [savedCollections, setSavedCollections] = useState<string[]>([]);

  const collections = useLiveQuery(() => db.collections.orderBy('sortOrder').toArray());

  useEffect(() => {
    if (open) {
      getBookmarkCollections(verseKey).then(setSavedCollections);
    }
  }, [open, verseKey]);

  const toggleCollection = async (collectionId: string) => {
    const isInCollection = savedCollections.includes(collectionId);
    if (isInCollection) {
      const bookmark = await db.bookmarks
        .where('verseKey')
        .equals(verseKey)
        .and((b) => b.collectionId === collectionId)
        .first();
      if (bookmark) {
        await removeBookmark(bookmark.id);
      }
      setSavedCollections((prev) => prev.filter((id) => id !== collectionId));
    } else {
      await addBookmark({ collectionId, verseKey, chapterId, verseNumber });
      setSavedCollections((prev) => [...prev, collectionId]);
    }
  };

  const handleCreateCollection = async () => {
    if (!newName.trim()) return;
    const id = await createCollection({
      name: newName.trim(),
      color: '#8b7355',
    });
    await addBookmark({ collectionId: id, verseKey, chapterId, verseNumber });
    setSavedCollections((prev) => [...prev, id]);
    setNewName('');
    setShowNewForm(false);
  };

  const ICON_MAP: Record<string, React.ReactNode> = {
    heart: <Heart className="h-4 w-4" />,
    bookmark: <FolderPlus className="h-4 w-4" />,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="text-base">Save {verseKey}</DialogTitle>
          <DialogDescription className="text-xs">
            Choose collections for this verse
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 max-h-[240px] overflow-y-auto -mx-1 px-1">
          {collections?.map((collection) => {
            const isSelected = savedCollections.includes(collection.id);
            return (
              <button
                key={collection.id}
                onClick={() => toggleCollection(collection.id)}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all',
                  isSelected
                    ? 'bg-primary/10 ring-1 ring-primary/20'
                    : 'hover:bg-secondary/80',
                )}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                  style={{ backgroundColor: collection.color + '18', color: collection.color }}
                >
                  {collection.icon && ICON_MAP[collection.icon]
                    ? ICON_MAP[collection.icon]
                    : <FolderPlus className="h-4 w-4" />}
                </div>
                <span className="flex-1 text-sm font-medium truncate">{collection.name}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {showNewForm ? (
          <div className="flex gap-2 pt-1">
            <div className="flex-1">
              <Label htmlFor="new-collection" className="sr-only">
                Collection name
              </Label>
              <Input
                id="new-collection"
                placeholder="Collection name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                autoFocus
                className="h-9 text-sm"
              />
            </div>
            <Button size="sm" className="h-9" onClick={handleCreateCollection}>
              Add
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 mt-1"
            onClick={() => setShowNewForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New Collection
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
