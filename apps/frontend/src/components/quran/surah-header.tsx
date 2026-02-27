import { cn } from "@/lib/utils";
import type { Chapter } from "@/lib/api/types";

interface SurahHeaderProps {
  chapter: Chapter;
  className?: string;
}

export function SurahHeader({ chapter, className }: SurahHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-border/30 p-7 text-center mb-2",
        className,
      )}
    >
      {/* Arabic name via surah_names font */}
      <h2
        className="text-3xl leading-relaxed text-foreground mb-2"
        dir="rtl"
        style={{
          fontFamily:
            "'surah_names', 'Scheherazade New', 'quran_common', serif",
        }}
      >
        {String(chapter.id).padStart(3, "0")}
      </h2>

      {/* English name */}
      <h3 className="text-sm font-medium text-muted-foreground">
        {chapter.name_simple}
      </h3>
    </div>
  );
}
