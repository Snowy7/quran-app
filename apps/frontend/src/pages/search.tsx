import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, X, ArrowRight, Clock } from "lucide-react";
import { Input, Skeleton } from "@template/ui";
import DOMPurify from "dompurify";
import { useSearchVerses } from "@/lib/api/search";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export default function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("noor-recent-searches");
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const {
    data: searchResults,
    isLoading,
    isError,
  } = useSearchVerses(debouncedQuery);

  const saveRecentSearch = (q: string) => {
    const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem("noor-recent-searches", JSON.stringify(updated));
  };

  const navigateToVerse = (verseKey: string) => {
    if (query.trim()) saveRecentSearch(query.trim());
    const [chapterId, verseNumber] = verseKey.split(":");
    navigate(`/quran/${chapterId}?verse=${verseNumber}`);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("noor-recent-searches");
  };

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl safe-area-top px-6 pb-3 pt-5">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 pr-10 h-12 bg-secondary/50 border-0 rounded-2xl text-sm placeholder:text-muted-foreground/60"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Recent searches */}
        {!debouncedQuery && recentSearches.length > 0 && (
          <div className="pt-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("recent")}
              </p>
              <button
                onClick={clearRecent}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {t("clearAll")}
              </button>
            </div>
            <div className="space-y-0.5">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl hover:bg-secondary/60 transition-colors text-left"
                >
                  <Clock className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  <span className="text-sm text-foreground truncate">
                    {term}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty prompt */}
        {!debouncedQuery && recentSearches.length === 0 && (
          <div className="pt-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary/60 mx-auto mb-4">
              <SearchIcon className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">
              {t("searchTheQuran")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("searchForVerses")}
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && debouncedQuery && (
          <div className="space-y-5 pt-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16 rounded-lg" />
                <Skeleton className="h-5 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && debouncedQuery && (
          <div className="pt-16 text-center text-sm text-muted-foreground">
            {t("somethingWentWrong")}
          </div>
        )}

        {/* Results */}
        {searchResults && debouncedQuery && (
          <div className="pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-4">
              {searchResults.total_results} result
              {searchResults.total_results !== 1 ? "s" : ""}
            </p>

            {searchResults.results.length === 0 && (
              <div className="pt-10 text-center text-sm text-muted-foreground">
                {t("noResults")} &ldquo;{debouncedQuery}&rdquo;
              </div>
            )}

            <div className="space-y-1">
              {searchResults.results.map((result) => (
                <button
                  key={result.verse_id}
                  onClick={() => navigateToVerse(result.verse_key)}
                  className="flex items-start gap-3 w-full px-4 py-4 rounded-2xl hover:bg-secondary/50 transition-colors text-left group"
                >
                  <div className="flex items-center justify-center h-8 min-w-[32px] rounded-xl bg-primary/8 text-primary text-[11px] font-bold mt-0.5 shrink-0">
                    {result.verse_key}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-base leading-[2] text-foreground line-clamp-2"
                      dir="rtl"
                      style={{
                        fontFamily: "'Scheherazade New', 'quran_common', serif",
                      }}
                    >
                      {result.text}
                    </p>
                    {result.translations?.[0]?.text && (
                      <p
                        className="text-xs text-muted-foreground leading-relaxed mt-1.5 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            result.translations[0].text,
                          ),
                        }}
                      />
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary mt-2 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
