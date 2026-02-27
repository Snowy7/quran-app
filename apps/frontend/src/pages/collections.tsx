import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus,
  Heart,
  FolderPlus,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
} from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { db } from '@/lib/db';
import { createCollection, deleteCollection } from '@/lib/db/collections';
import { cn } from '@/lib/utils';

const COLLECTION_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#8b7355',
];

const ICON_MAP: Record<string, React.ElementType> = {
  heart: Heart,
  bookmark: FolderPlus,
};

export default function CollectionsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLLECTION_COLORS[7]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const collections = useLiveQuery(() => db.collections.orderBy('sortOrder').toArray());
  const bookmarkCounts = useLiveQuery(async () => {
    if (!collections) return {};
    const counts: Record<string, number> = {};
    for (const c of collections) {
      counts[c.id] = await db.bookmarks.where('collectionId').equals(c.id).count();
    }
    return counts;
  }, [collections]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCollection({ name: newName.trim(), color: newColor });
    setNewName('');
    setNewColor(COLLECTION_COLORS[7]);
    setCreateOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteCollection(id);
    setDeleteConfirm(null);
  };

  return (
    <div>
      <AppHeader
        title="Collections"
        rightContent={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <div className="px-5 pb-8">
        {!collections || collections.length === 0 ? (
          <div className="pt-16 text-center">
            <FolderPlus className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No collections yet
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              Create Collection
            </Button>
          </div>
        ) : (
          <div className="space-y-2 pt-3">
            {collections.map((collection) => {
              const Icon = (collection.icon && ICON_MAP[collection.icon]) || FolderPlus;
              const count = bookmarkCounts?.[collection.id] ?? 0;

              return (
                <div key={collection.id} className="relative group">
                  <Link to={`/collections/${collection.id}`}>
                    <Card className="hover:border-border transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                            style={{
                              backgroundColor: collection.color + '15',
                              color: collection.color,
                            }}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {collection.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {count} verse{count !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Delete on long-press / visible on hover */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteConfirm(collection.id);
                    }}
                    className="absolute top-1/2 -translate-y-1/2 right-12 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-base">New Collection</DialogTitle>
            <DialogDescription className="text-xs">
              Organize your saved verses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="collection-name" className="text-xs">
                Name
              </Label>
              <Input
                id="collection-name"
                placeholder="e.g. Duas, Favorites"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
                className="mt-1.5 h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Color</Label>
              <div className="flex gap-2 mt-1.5">
                {COLLECTION_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={cn(
                      'h-7 w-7 rounded-full transition-all',
                      newColor === color
                        ? 'ring-2 ring-offset-2 ring-offset-background scale-110'
                        : 'hover:scale-105',
                    )}
                    style={{ backgroundColor: color, '--tw-ring-color': color } as React.CSSProperties}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full" size="sm">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle className="text-base">Delete Collection?</DialogTitle>
            <DialogDescription className="text-xs">
              This will remove all bookmarks in this collection. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
