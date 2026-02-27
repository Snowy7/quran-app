import { cn } from '@/lib/utils';
import type { Chapter } from '@/lib/api/types';

interface SurahHeaderProps {
  chapter: Chapter;
  className?: string;
}

export function SurahHeader({ chapter, className }: SurahHeaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 text-center',
        className,
      )}
    >
      {/* Arabic name */}
      <h2
        className="text-3xl leading-relaxed text-foreground mb-2"
        dir="rtl"
        style={{ fontFamily: "'Amiri Quran', 'Amiri', 'Scheherazade New', serif" }}
      >
        {chapter.name_arabic}
      </h2>

      {/* English transliteration */}
      <h3 className="text-lg font-semibold text-foreground">
        {chapter.name_simple}
      </h3>

      {/* Translation */}
      <p className="text-sm text-muted-foreground mt-0.5">
        {chapter.translated_name.name}
      </p>

      {/* Meta info */}
      <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
            chapter.revelation_place === 'makkah'
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
          )}
        >
          {chapter.revelation_place === 'makkah' ? 'Makki' : 'Madani'}
        </span>
        <span className="text-border">|</span>
        <span>{chapter.verses_count} verses</span>
      </div>
    </div>
  );
}
