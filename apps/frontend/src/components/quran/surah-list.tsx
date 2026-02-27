import { Link } from "react-router-dom";
import { Skeleton } from "@template/ui";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { Chapter } from "@/lib/api/types";

interface SurahListProps {
  chapters: Chapter[] | undefined;
  isLoading: boolean;
  searchQuery: string;
}

export function SurahList({
  chapters,
  isLoading,
  searchQuery,
}: SurahListProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="px-6 space-y-1">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4">
            <Skeleton className="h-11 w-11 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!chapters) return null;

  const filtered = searchQuery
    ? chapters.filter(
        (c) =>
          c.name_simple.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.name_arabic.includes(searchQuery) ||
          c.translated_name.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          String(c.id) === searchQuery,
      )
    : chapters;

  if (filtered.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-muted-foreground text-sm">
        {t("noSurahsFound")} &ldquo;{searchQuery}&rdquo;
      </div>
    );
  }

  return (
    <div className="px-6">
      {filtered.map((chapter) => (
        <Link
          key={chapter.id}
          to={`/quran/${chapter.id}`}
          className="flex items-center gap-4 py-4 border-b border-border/30 last:border-0 hover:bg-secondary/30 -mx-6 px-6 transition-colors active:bg-secondary/50"
        >
          {/* Surah number */}
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 text-primary font-bold text-sm shrink-0">
            {chapter.id}
          </div>

          {/* Name and details */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[15px] text-foreground truncate">
              {chapter.name_simple}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span
                className={cn(
                  "uppercase tracking-wide text-[10px] font-semibold",
                  chapter.revelation_place === "makkah"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {chapter.revelation_place === "makkah"
                  ? t("meccan")
                  : t("medinan")}
              </span>
              <span className="text-border">&#183;</span>
              <span>
                {chapter.verses_count} {t("verses")}
              </span>
            </div>
          </div>

          {/* Arabic name */}
          <span
            className="text-[1.15rem] text-foreground/70 shrink-0"
            dir="rtl"
            style={{ fontFamily: "'Scheherazade New', 'quran_common', serif" }}
          >
            {chapter.name_arabic}
          </span>
        </Link>
      ))}
    </div>
  );
}
