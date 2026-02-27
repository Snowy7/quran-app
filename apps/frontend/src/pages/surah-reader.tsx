import { useState, useEffect, useRef } from "react";
import {
  useParams,
  useLocation,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { Mic, ChevronDown } from "lucide-react";
import { Button, Skeleton } from "@template/ui";
import { AppHeader } from "@/components/layout/app-header";
import { useChapters } from "@/lib/api/chapters";
import { SurahHeader } from "@/components/quran/surah-header";
import { ReadingModeToggle } from "@/components/quran/reading-mode-toggle";
import { TranslationView } from "@/components/quran/translation-view";
import { WordByWordView } from "@/components/quran/word-by-word-view";
import { MushafView } from "@/components/quran/mushaf-view";
import { TafsirView } from "@/components/quran/tafsir-view";
import { ReciterPicker } from "@/components/audio/reciter-picker";
import { saveReadingPosition } from "@/lib/db/reading-history";
import { getSetting } from "@/lib/db/settings";
import { cn } from "@/lib/utils";
import type { Chapter } from "@/lib/api/types";

export default function SurahReaderPage() {
  const { surahId, juzId, pageId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [readingMode, setReadingMode] = useState("translation");
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);
  const [surahPickerOpen, setSurahPickerOpen] = useState(false);

  const { data: chapters, isLoading: chaptersLoading } = useChapters();

  const isJuzView = location.pathname.includes("/juz/");
  const isPageView = location.pathname.includes("/page/");

  const chapterId = surahId ? parseInt(surahId, 10) : undefined;
  const pageNumber = pageId ? parseInt(pageId, 10) : NaN;
  const chapter = chapters?.find((c) => c.id === chapterId);

  const initialVerse = searchParams.get("verse")
    ? parseInt(searchParams.get("verse")!, 10)
    : undefined;

  useEffect(() => {
    getSetting<string>("readingMode", "translation").then((mode) => {
      if (
        mode === "translation" ||
        mode === "word-by-word" ||
        mode === "mushaf" ||
        mode === "tafsir"
      ) {
        setReadingMode(mode);
      }
    });
  }, []);

  useEffect(() => {
    if (chapterId) {
      saveReadingPosition(
        chapterId,
        initialVerse || 1,
        readingMode as "translation" | "mushaf" | "word-by-word" | "tafsir",
      ).catch(() => {});
    }
  }, [chapterId, readingMode, initialVerse]);

  const pageTitle = Number.isInteger(pageNumber) ? pageNumber : "Invalid";
  const headerTitle = isJuzView
    ? `Juz ${juzId}`
    : isPageView
      ? `Page ${pageTitle}`
      : (chapter?.name_simple ?? `Surah ${surahId ?? ""}`);
  const isMushafMode = readingMode === "mushaf";

  const handleModeChange = (mode: string) => {
    setReadingMode(mode);
    import("@/lib/db/settings").then(({ setSetting }) => {
      setSetting("readingMode", mode);
    });
  };

  const surahDropdown =
    chapterId && chapters ? (
      <div className="relative">
        <button
          onClick={() => setSurahPickerOpen((v) => !v)}
          className="flex items-center gap-1 press-effect"
        >
          <div className="flex flex-col items-center">
            <span
              className="text-lg text-foreground leading-tight"
              dir="rtl"
              style={{
                fontFamily:
                  "'surah_names', 'Scheherazade New', 'quran_common', serif",
              }}
            >
              {String(chapterId).padStart(3, "0")}
            </span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
              {headerTitle}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
              surahPickerOpen && "rotate-180",
            )}
          />
        </button>

        {surahPickerOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setSurahPickerOpen(false)}
            />
            <SurahPickerDropdown
              chapters={chapters}
              currentId={chapterId}
              onSelect={(id) => {
                setSurahPickerOpen(false);
                navigate(`/quran/${id}`);
              }}
            />
          </>
        )}
      </div>
    ) : undefined;

  return (
    <div className="page-container">
      <AppHeader
        title={!surahDropdown ? headerTitle : undefined}
        subtitle={undefined}
        centerContent={surahDropdown}
        showBack
        className={isMushafMode ? "border-b border-border/30" : undefined}
        rightContent={
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary"
            onClick={() => setReciterPickerOpen(true)}
          >
            <Mic className="h-4 w-4" />
            <span className="sr-only">Choose reciter</span>
          </Button>
        }
      />

      <div className={isMushafMode ? "px-4 md:px-6" : "px-6"}>
        <div className={isMushafMode ? "mx-auto max-w-[980px] py-3" : "py-3"}>
          <ReadingModeToggle
            mode={readingMode}
            onModeChange={handleModeChange}
          />
        </div>

        {chaptersLoading && (
          <div className="space-y-3 py-6">
            <Skeleton className="h-6 w-32 mx-auto rounded-xl" />
            <Skeleton className="h-8 w-48 mx-auto rounded-xl" />
            <Skeleton className="h-4 w-24 mx-auto rounded-xl" />
          </div>
        )}

        {chapter && !isPageView && !isMushafMode && (
          <SurahHeader chapter={chapter} />
        )}
      </div>

      {readingMode === "translation" && chapterId && (
        <TranslationView
          chapterId={chapterId}
          totalVerses={chapter?.verses_count}
          initialVerse={initialVerse}
        />
      )}

      {readingMode === "word-by-word" && chapterId && (
        <WordByWordView chapterId={chapterId} />
      )}

      {readingMode === "tafsir" && chapterId && (
        <TafsirView
          chapterId={chapterId}
          totalVerses={chapter?.verses_count}
          initialVerse={initialVerse}
        />
      )}

      {readingMode === "mushaf" && chapterId && (
        <MushafView chapterId={chapterId} />
      )}
      {readingMode === "mushaf" &&
        isPageView &&
        Number.isInteger(pageNumber) &&
        !chapterId && (
          <MushafView startPage={pageNumber} endPage={pageNumber} />
        )}

      {!chapterId &&
        !Number.isInteger(pageNumber) &&
        !chaptersLoading &&
        isPageView && (
          <div className="px-6 py-16 text-center text-muted-foreground text-sm">
            Invalid page number.
          </div>
        )}

      {!chapterId && !isPageView && !isJuzView && !chaptersLoading && (
        <div className="px-6 py-16 text-center text-muted-foreground text-sm">
          Invalid surah ID.
        </div>
      )}

      {isJuzView && !isPageView && (
        <div className="px-6 py-16 text-center text-muted-foreground text-sm">
          Juz-based mode is not yet available.
        </div>
      )}

      {isPageView &&
        readingMode !== "mushaf" &&
        !chaptersLoading &&
        Number.isInteger(pageNumber) && (
          <div className="px-6 py-16 text-center text-muted-foreground text-sm">
            Page mode only is available for page-based reading right now.
          </div>
        )}

      <ReciterPicker
        open={reciterPickerOpen}
        onOpenChange={setReciterPickerOpen}
      />
    </div>
  );
}

function SurahPickerDropdown({
  chapters,
  currentId,
  onSelect,
}: {
  chapters: Chapter[];
  currentId: number;
  onSelect: (id: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to current surah
    const el = listRef.current?.querySelector(`[data-surah="${currentId}"]`);
    if (el) {
      el.scrollIntoView({ block: "center" });
    }
  }, [currentId]);

  return (
    <div className="absolute top-full left-1/2 mt-2 z-50 w-64 max-h-80 overflow-hidden bg-card border border-border/50 rounded-2xl shadow-elevated animate-dropdown-in">
      <div
        ref={listRef}
        className="overflow-y-auto max-h-80 py-1 scrollbar-hide"
      >
        {chapters.map((ch) => (
          <button
            key={ch.id}
            data-surah={ch.id}
            onClick={() => onSelect(ch.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
              ch.id === currentId
                ? "bg-primary/10 text-primary"
                : "hover:bg-secondary/60 text-foreground",
            )}
          >
            <span className="w-7 text-center text-xs font-medium text-muted-foreground tabular-nums">
              {ch.id}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate block">
                {ch.name_simple}
              </span>
            </div>
            <span
              className="text-lg text-foreground/70"
              dir="rtl"
              style={{
                fontFamily:
                  "'surah_names', 'Scheherazade New', 'quran_common', serif",
              }}
            >
              {String(ch.id).padStart(3, "0")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
