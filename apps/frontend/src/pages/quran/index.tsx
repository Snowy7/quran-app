import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search } from "lucide-react";
import { SURAHS } from "@/data/surahs";
import { JUZ_DATA } from "@/data/juz";
import { TOTAL_PAGES } from "@/data/quran-data";
import { AppHeader } from "@/components/layout/app-header";
import { useOfflineReadingProgress } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type ViewMode = "surah" | "juz" | "page";

const PAGES = Array.from({ length: TOTAL_PAGES }, (_, i) => ({
  id: i + 1,
}));

export default function QuranIndexPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("surah");
  const [searchQuery, setSearchQuery] = useState("");
  const { progress } = useOfflineReadingProgress();

  const lastSurah = progress?.lastSurahId
    ? SURAHS.find((s) => s.id === progress.lastSurahId)
    : null;

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return SURAHS;
    const q = searchQuery.toLowerCase();
    return SURAHS.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.name.includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.id.toString() === q,
    );
  }, [searchQuery]);

  return (
    <div className="page-container">
      <AppHeader title="Quran" />

      {/* Continue Reading */}
      <Link
        to={lastSurah ? `/quran/${lastSurah.id}` : "/quran/1"}
        className="block mx-4 mt-3 mb-4 animate-fade-in max-w-2xl lg:mx-auto"
      >
        <div className="relative rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg active:scale-[0.995]">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, hsl(32 80% 44%) 0%, hsl(28 75% 38%) 50%, hsl(24 70% 32%) 100%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "16px 16px",
            }}
          />

          <div className="relative z-10 flex items-center justify-between px-5 py-4">
            <div className="min-w-0">
              <p className="text-amber-200/60 text-[9px] font-semibold uppercase tracking-[0.15em] mb-1">
                Continue Reading
              </p>
              <h2 className="text-white text-lg font-bold leading-tight mb-0.5">
                {lastSurah?.englishName || "Al-Fatihah"}
              </h2>
              <div className="flex items-center gap-1.5 text-amber-100/70 text-[11px]">
                <span className="arabic-text text-xs leading-none">
                  {lastSurah?.name ||
                    "\u0627\u0644\u0641\u0627\u062A\u062D\u0629"}
                </span>
                <span className="text-amber-200/30">&middot;</span>
                <span>Ayah {progress?.lastAyahNumber || 1}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 ml-3">
              <BookOpen className="w-5 h-5 text-white/80" />
            </div>
          </div>
        </div>
      </Link>

      {/* Filters + Search */}
      <div className="px-4 mb-3 max-w-2xl lg:mx-auto">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[13px] font-semibold text-foreground/70">
            Browse
          </h2>
          <div className="flex gap-0.5 bg-secondary/50 rounded-full p-0.5">
            {(["surah", "juz", "page"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-medium capitalize transition-all duration-200",
                  viewMode === mode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setViewMode(mode)}
              >
                {mode === "juz" ? "Juz" : mode === "page" ? "Page" : "Surah"}
              </button>
            ))}
          </div>
        </div>

        {/* Search — surah view only */}
        {viewMode === "surah" && (
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Search surahs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-8 pr-4 py-2 text-[13px] rounded-xl",
                "bg-secondary/30 border border-border/40",
                "placeholder:text-muted-foreground/35",
                "focus:outline-none focus:ring-2 focus:ring-primary/15 focus:bg-secondary/50",
                "transition-all",
              )}
            />
          </div>
        )}
      </div>

      {/* List */}
      <div className="max-w-2xl lg:mx-auto">
        {viewMode === "surah" && (
          <div>
            {filteredSurahs.map((surah) => (
              <Link
                key={surah.id}
                to={`/quran/${surah.id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5",
                  "transition-colors duration-100",
                  "hover:bg-secondary/30 active:bg-secondary/50",
                )}
              >
                {/* Number */}
                <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-[11px] font-semibold text-muted-foreground/70 shrink-0 tabular-nums">
                  {surah.id}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[13px] leading-tight">
                    {surah.englishName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-px rounded font-medium",
                        surah.revelationType === "Meccan"
                          ? "bg-amber-500/8 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-500/8 text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {surah.revelationType === "Meccan" ? "Makkah" : "Madinah"}
                    </span>
                    <span className="text-[9px] text-muted-foreground/40">
                      &middot;
                    </span>
                    <span className="text-[9px] text-muted-foreground/60">
                      {surah.numberOfAyahs} Ayahs
                    </span>
                  </div>
                </div>

                {/* Arabic name */}
                <span className="arabic-text text-[15px] text-foreground/70 shrink-0">
                  {surah.name}
                </span>
              </Link>
            ))}
          </div>
        )}

        {viewMode === "juz" && (
          <div>
            {JUZ_DATA.map((juz) => {
              const startSurah = SURAHS.find((s) => s.id === juz.startSurah);
              return (
                <Link
                  key={juz.id}
                  to={`/quran/juz/${juz.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-[11px] font-semibold text-muted-foreground/70 shrink-0 tabular-nums">
                    {juz.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[13px] leading-tight">
                      {juz.name}
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                      Starts: {startSurah?.englishName} {juz.startAyah}
                    </p>
                  </div>
                  <span className="arabic-text text-[15px] text-foreground/70 shrink-0">
                    {juz.arabicName}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {viewMode === "page" && (
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1 p-4">
            {PAGES.map((page) => (
              <Link
                key={page.id}
                to={`/quran/page/${page.id}`}
                className={cn(
                  "aspect-[3/4] flex items-center justify-center rounded-lg",
                  "bg-secondary/30 hover:bg-secondary/60 border border-border/20",
                  "transition-all duration-100 active:scale-95",
                  "text-[10px] font-medium tabular-nums text-muted-foreground/70",
                )}
              >
                {page.id}
              </Link>
            ))}
          </div>
        )}
      </div>

      {filteredSurahs.length === 0 && viewMode === "surah" && (
        <div className="text-center py-16">
          <p className="text-muted-foreground/60 text-sm">
            No surahs match "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
