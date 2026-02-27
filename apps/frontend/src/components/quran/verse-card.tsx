import DOMPurify from 'dompurify';
import { MoreHorizontal } from 'lucide-react';
import { Button, Separator } from '@template/ui';
import type { Verse } from '@/lib/api/types';

interface VerseCardProps {
  verse: Verse;
  chapterNumber: number;
}

export function VerseCard({ verse, chapterNumber }: VerseCardProps) {
  const translationText = verse.translations?.[0]?.text;

  return (
    <div>
      <div className="px-5 py-5 md:px-8">
        {/* Top row: verse number + actions */}
        <div className="flex items-center justify-between mb-4">
          {/* Ayah number badge */}
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {verse.verseNumber}
          </div>

          {/* Action button */}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Verse actions for {chapterNumber}:{verse.verseNumber}</span>
          </Button>
        </div>

        {/* Arabic text */}
        <p
          className="arabic-text text-2xl md:text-3xl leading-[2.4] text-foreground mb-4"
          dir="rtl"
          style={{ fontFamily: "'Amiri Quran', 'Amiri', 'Scheherazade New', serif" }}
        >
          {verse.textUthmani}
        </p>

        {/* Translation */}
        {translationText && (
          <p
            className="text-sm md:text-base leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(translationText),
            }}
          />
        )}
      </div>

      <Separator />
    </div>
  );
}
