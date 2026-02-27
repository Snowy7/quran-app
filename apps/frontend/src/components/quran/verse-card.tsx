import { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import {
  Bookmark,
  Copy,
  Share2,
  MoreHorizontal,
  BookOpen,
  Play,
  Brain,
} from 'lucide-react';
import {
  Button,
  Separator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@template/ui';
import { cn } from '@/lib/utils';
import type { Verse } from '@/lib/api/types';
import { SaveToCollection } from './save-to-collection';
import { TafsirPanel } from './tafsir-panel';
import { HifzMarkDialog } from './hifz-mark-dialog';
import { useAudioStore } from '@/lib/stores/audio-store';
import { useReaderSettings } from '@/lib/hooks/use-settings';
import { toast } from 'sonner';

interface VerseCardProps {
  verse: Verse;
  chapterNumber: number;
  totalVerses?: number;
  isHighlighted?: boolean;
}

export function VerseCard({
  verse,
  chapterNumber,
  totalVerses,
  isHighlighted,
}: VerseCardProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [hifzDialogOpen, setHifzDialogOpen] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const translationText = verse.translations?.[0]?.text;
  const verseKey = `${chapterNumber}:${verse.verse_number}`;

  const { play, currentVerseKey, isPlaying } = useAudioStore();
  const { arabicFontSize, translationFontSize } = useReaderSettings();
  const isCurrentlyPlaying = currentVerseKey === verseKey && isPlaying;

  const handlePlay = useCallback(() => {
    play(verseKey, totalVerses);
  }, [play, verseKey, totalVerses]);

  const handleCopy = useCallback(async () => {
    const parts = [verse.text_uthmani || ''];
    if (translationText) {
      const el = document.createElement('div');
      el.innerHTML = DOMPurify.sanitize(translationText);
      parts.push(el.textContent || '');
    }
    parts.push(`- Quran ${verseKey}`);
    await navigator.clipboard.writeText(parts.join('\n\n'));
    toast.success('Verse copied');
  }, [verse.text_uthmani, translationText, verseKey]);

  const handleShare = useCallback(async () => {
    const parts = [verse.text_uthmani || ''];
    if (translationText) {
      const el = document.createElement('div');
      el.innerHTML = DOMPurify.sanitize(translationText);
      parts.push(el.textContent || '');
    }
    parts.push(`- Quran ${verseKey}`);
    const text = parts.join('\n\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: `Quran ${verseKey}`, text });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Verse copied');
    }
  }, [verse.text_uthmani, translationText, verseKey]);

  return (
    <>
      <div
        className={cn(
          'transition-colors duration-500',
          isHighlighted && 'bg-primary/5',
          isCurrentlyPlaying && 'bg-primary/[0.04]',
        )}
        id={`verse-${verseKey}`}
      >
        <div className="px-5 py-5 md:px-8">
          {/* Quran-first RTL row: ayah marker on the right, actions on the left */}
          <div className="mb-4 flex flex-row-reverse items-center justify-between">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold tabular-nums transition-colors',
                isCurrentlyPlaying
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/8 text-primary',
              )}
            >
              {verse.verse_number}
            </div>

            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={handlePlay}
              >
                <Play
                  className={cn('h-3.5 w-3.5', isCurrentlyPlaying && 'text-primary')}
                />
                <span className="sr-only">Play verse</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => setSaveDialogOpen(true)}
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span className="sr-only">Save verse</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save to Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setHifzDialogOpen(true)}>
                    <Brain className="mr-2 h-4 w-4" />
                    Mark as Memorized
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePlay}>
                    <Play className="mr-2 h-4 w-4" />
                    Play Audio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTafsirOpen(!tafsirOpen)}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {tafsirOpen ? 'Hide' : 'View'} Tafsir
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Verse
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <p
            className="mb-4 text-right leading-[2.3] text-foreground"
            dir="rtl"
            lang="ar"
            style={{
              fontFamily: "'Scheherazade New', 'quran_common', serif",
              fontSize: `${arabicFontSize}px`,
            }}
          >
            {verse.text_uthmani}
          </p>

          {translationText && (
            <p
              className="text-left leading-[1.85] text-muted-foreground"
              dir="ltr"
              style={{ fontSize: `${translationFontSize}px` }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(translationText),
              }}
            />
          )}
        </div>

        {tafsirOpen && (
          <TafsirPanel
            verseKey={verseKey}
            isOpen={tafsirOpen}
            onToggle={() => setTafsirOpen(false)}
          />
        )}

        <Separator className="opacity-50" />
      </div>

      <SaveToCollection
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        verseKey={verseKey}
        chapterId={chapterNumber}
        verseNumber={verse.verse_number}
      />

      <HifzMarkDialog
        open={hifzDialogOpen}
        onOpenChange={setHifzDialogOpen}
        verseKey={verseKey}
        chapterId={chapterNumber}
        verseNumber={verse.verse_number}
      />
    </>
  );
}

