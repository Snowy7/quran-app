import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Heart, FolderPlus, ChevronRight, Trash2 } from "lucide-react";
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
} from "@template/ui";
import { AppHeader } from "@/components/layout/app-header";
import { db } from "@/lib/db";
import { createCollection, deleteCollection } from "@/lib/db/collections";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

const COLLECTION_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#0B6B4F",
];

const ICON_MAP: Record<string, React.ElementType> = {
  heart: Heart,
  bookmark: FolderPlus,
};

export default function CollectionsPage() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLLECTION_COLORS[7]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const collections = useLiveQuery(() =>
    db.collections.orderBy("sortOrder").toArray(),
  );
  const bookmarkCounts = useLiveQuery(async () => {
    if (!collections) return {};
    const counts: Record<string, number> = {};
    for (const c of collections) {
      counts[c.id] = await db.bookmarks
        .where("collectionId")
        .equals(c.id)
        .count();
    }
    return counts;
  }, [collections]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCollection({ name: newName.trim(), color: newColor });
    setNewName("");
    setNewColor(COLLECTION_COLORS[7]);
    setCreateOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteCollection(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="animate-fade-in">
      <AppHeader
        title={t("collections")}
        rightContent={
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-2xl text-muted-foreground hover:bg-secondary"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <div className="px-6 pb-8">
        {!collections || collections.length === 0 ? (
          <div className="pt-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary/60 mx-auto mb-4">
              <FolderPlus className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">
              {t("noCollectionsYet")}
            </p>
            <p className="text-sm text-muted-foreground mb-5">
              {t("saveVerseIntoCollections")}
            </p>
            <Button
              size="default"
              onClick={() => setCreateOpen(true)}
              className="gap-2 rounded-2xl px-6"
            >
              <Plus className="h-4 w-4" />
              {t("createCollection")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-3">
            {collections.map((collection) => {
              const Icon =
                (collection.icon && ICON_MAP[collection.icon]) || FolderPlus;
              const count = bookmarkCounts?.[collection.id] ?? 0;

              return (
                <div key={collection.id} className="relative group">
                  <Link to={`/collections/${collection.id}`}>
                    <Card className="border-0 shadow-card hover:shadow-soft transition-all duration-200 rounded-2xl">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
                            style={{
                              backgroundColor: collection.color + "15",
                              color: collection.color,
                            }}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[15px] text-foreground truncate">
                              {collection.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {count} {count !== 1 ? t("verses") : t("verse")}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteConfirm(collection.id);
                    }}
                    className="absolute top-1/2 -translate-y-1/2 right-12 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{t("newCollection")}</DialogTitle>
            <DialogDescription className="text-sm">
              {t("organizeVerses")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <div>
              <Label htmlFor="collection-name" className="text-sm font-medium">
                {t("name")}
              </Label>
              <Input
                id="collection-name"
                placeholder={t("collectionPlaceholder")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
                className="mt-2 h-12 rounded-2xl"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{t("color")}</Label>
              <div className="flex gap-2.5 mt-2">
                {COLLECTION_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all duration-200",
                      newColor === color
                        ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                        : "hover:scale-105",
                    )}
                    style={
                      {
                        backgroundColor: color,
                        "--tw-ring-color": color,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreate}
              className="w-full rounded-2xl h-12 font-semibold"
            >
              {t("create")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">
              {t("deleteCollection")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("deleteCollectionDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDeleteConfirm(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              {t("delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
