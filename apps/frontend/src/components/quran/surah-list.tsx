import { Link } from 'react-router-dom';
import { Skeleton } from '@template/ui';
import { cn } from '@/lib/utils';
import type { Chapter } from '@/lib/api/types';

interface SurahListProps {
  chapters: Chapter[] | undefined;
  isLoading: boolean;
  searchQuery: string;
}

export function SurahList({ chapters, isLoading, searchQuery }: SurahListProps) {
  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
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
          c.translated_name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(c.id) === searchQuery,
      )
    : chapters;

  if (filtered.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-muted-foreground text-sm">
        No surahs found for "{searchQuery}"
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {filtered.map((chapter) => (
        <Link
          key={chapter.id}
          to={`/quran/${chapter.id}`}
          className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/50 active:bg-secondary transition-colors"
        >
          {/* Surah number */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary font-semibold text-sm">
            {chapter.id}
          </div>

          {/* Name and details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">
                {chapter.name_simple}
              </span>
              <span className="text-xs text-muted-foreground">
                {chapter.translated_name.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span
                className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                  chapter.revelation_place === 'makkah'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                )}
              >
                {chapter.revelation_place === 'makkah' ? 'Makki' : 'Madani'}
              </span>
              <span>{chapter.verses_count} verses</span>
            </div>
          </div>

          {/* Arabic name */}
          <span
            className="text-lg font-arabic text-foreground/80"
            dir="rtl"
            style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}
          >
            {chapter.name_arabic}
          </span>
        </Link>
      ))}
    </div>
  );
}
