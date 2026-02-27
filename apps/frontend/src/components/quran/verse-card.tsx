import { useState, useCallback } from "react";
import DOMPurify from "dompurify";
import {
  Bookmark,
  Copy,
  Share2,
  MoreHorizontal,
  BookOpen,
  Play,
  Brain,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@template/ui";
import { cn } from "@/lib/utils";
import type { Verse } from "@/lib/api/types";
import { SaveToCollection } from "./save-to-collection";
import { TafsirPanel } from "./tafsir-panel";
import { HifzMarkDialog } from "./hifz-mark-dialog";
import { useAudioStore } from "@/lib/stores/audio-store";
import {
  useReaderSettings,
  useContentWidth,
  getContentFontScale,
} from "@/lib/hooks/use-settings";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";

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
  const { t } = useTranslation();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [hifzDialogOpen, setHifzDialogOpen] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const translationText = verse.translations?.[0]?.text;
  const verseKey = `${chapterNumber}:${verse.verse_number}`;

  const { play, currentVerseKey, isPlaying } = useAudioStore();
  const { arabicFontSize, translationFontSize } = useReaderSettings();
  const cw = useContentWidth();
  const scale = getContentFontScale(cw);
  const scaledArabic = Math.round(arabicFontSize * scale);
  const scaledTranslation = Math.round(translationFontSize * scale);
  const isCurrentlyPlaying = currentVerseKey === verseKey && isPlaying;

  const handlePlay = useCallback(() => {
    play(verseKey, totalVerses);
  }, [play, verseKey, totalVerses]);

  const handleCopy = useCallback(async () => {
    const parts = [verse.text_uthmani || ""];
    if (translationText) {
      const el = document.createElement("div");
      el.innerHTML = DOMPurify.sanitize(translationText);
      parts.push(el.textContent || "");
    }
    parts.push(`- Quran ${verseKey}`);
    await navigator.clipboard.writeText(parts.join("\n\n"));
    toast.success(t("verseCopied"));
  }, [verse.text_uthmani, translationText, verseKey, t]);

  const handleShare = useCallback(async () => {
    const parts = [verse.text_uthmani || ""];
    if (translationText) {
      const el = document.createElement("div");
      el.innerHTML = DOMPurify.sanitize(translationText);
      parts.push(el.textContent || "");
    }
    parts.push(`- Quran ${verseKey}`);
    const text = parts.join("\n\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: `Quran ${verseKey}`, text });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success(t("verseCopied"));
    }
  }, [verse.text_uthmani, translationText, verseKey, t]);

  return (
    <>
      <div
        className={cn(
          "transition-colors duration-500",
          isHighlighted && "bg-primary/[0.04]",
          isCurrentlyPlaying && "bg-primary/[0.03]",
        )}
        id={`verse-${verseKey}`}
      >
        <div className="px-6 py-6">
          {/* Action row */}
          <div className="mb-5 flex flex-row-reverse items-center justify-between">
            {/* Verse number badge */}
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold tabular-nums transition-all",
                isCurrentlyPlaying
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-primary/8 text-primary",
              )}
            >
              {verse.verse_number}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/8"
                onClick={handlePlay}
              >
                <Play
                  className={cn(
                    "h-4 w-4",
                    isCurrentlyPlaying && "text-primary",
                  )}
                />
                <span className="sr-only">{t("playVerse")}</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/8"
                onClick={() => setSaveDialogOpen(true)}
              >
                <Bookmark className="h-4 w-4" />
                <span className="sr-only">{t("saveVerse")}</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">{t("moreActions")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuItem
                    onClick={() => setSaveDialogOpen(true)}
                    className="rounded-lg"
                  >
                    <Bookmark className="mr-2 h-4 w-4" />
                    {t("saveToCollection")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setHifzDialogOpen(true)}
                    className="rounded-lg"
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    {t("markAsMemorized")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePlay} className="rounded-lg">
                    <Play className="mr-2 h-4 w-4" />
                    {t("playAudio")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTafsirOpen(!tafsirOpen)}
                    className="rounded-lg"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    {tafsirOpen ? t("hideTafsir") : t("viewTafsir")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopy} className="rounded-lg">
                    <Copy className="mr-2 h-4 w-4" />
                    {t("copyVerse")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleShare}
                    className="rounded-lg"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    {t("share")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Arabic text */}
          <p
            className="mb-5 text-right leading-[2.3] text-foreground"
            dir="rtl"
            lang="ar"
            style={{
              fontFamily: "'Scheherazade New', 'quran_common', serif",
              fontSize: `${scaledArabic}px`,
            }}
          >
            {verse.text_uthmani}
          </p>

          {/* Translation */}
          {translationText && (
            <p
              className="text-left leading-[1.9] text-muted-foreground"
              dir="ltr"
              style={{ fontSize: `${scaledTranslation}px` }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(translationText),
              }}
            />
          )}
        </div>

        {/* Tafsir */}
        {tafsirOpen && (
          <TafsirPanel
            verseKey={verseKey}
            isOpen={tafsirOpen}
            onToggle={() => setTafsirOpen(false)}
          />
        )}

        {/* Divider */}
        <div className="mx-6 border-b border-border/30" />
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
