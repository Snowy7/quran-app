import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, ArrowRight, Clock } from 'lucide-react';
import { Input, Skeleton } from '@template/ui';
import DOMPurify from 'dompurify';
import { useSearchVerses } from '@/lib/api/search';
import { cn } from '@/lib/utils';

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem('noor-recent-searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
    inputRef.current?.focus();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults, isLoading, isError } = useSearchVerses(debouncedQuery);

  const saveRecentSearch = (q: string) => {
    const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem('noor-recent-searches', JSON.stringify(updated));
  };

  const navigateToVerse = (verseKey: string) => {
    if (query.trim()) saveRecentSearch(query.trim());
    const [chapterId, verseNumber] = verseKey.split(':');
    navigate(`/quran/${chapterId}?verse=${verseNumber}`);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('noor-recent-searches');
  };

  return (
    <div className="min-h-screen">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm safe-area-top px-5 pb-3 pt-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search the Quran..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9 h-11 bg-secondary/50 border-0 text-sm"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pb-8">
        {/* No query: show recent searches */}
        {!debouncedQuery && recentSearches.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Recent
              </p>
              <button
                onClick={clearRecent}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="space-y-0.5">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors text-left"
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground truncate">{term}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No query, no recents: prompt */}
        {!debouncedQuery && recentSearches.length === 0 && (
          <div className="pt-16 text-center">
            <SearchIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Search for verses, words, or topics
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && debouncedQuery && (
          <div className="space-y-4 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && debouncedQuery && (
          <div className="pt-12 text-center text-sm text-muted-foreground">
            Something went wrong. Please try again.
          </div>
        )}

        {/* Results */}
        {searchResults && debouncedQuery && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-3">
              {searchResults.total_results} result{searchResults.total_results !== 1 ? 's' : ''}
            </p>

            {searchResults.results.length === 0 && (
              <div className="pt-8 text-center text-sm text-muted-foreground">
                No results found for "{debouncedQuery}"
              </div>
            )}

            <div className="space-y-1">
              {searchResults.results.map((result) => (
                <button
                  key={result.verse_id}
                  onClick={() => navigateToVerse(result.verse_key)}
                  className="flex items-start gap-3 w-full px-3 py-3.5 rounded-lg hover:bg-secondary/60 transition-colors text-left group"
                >
                  <div className="flex items-center justify-center h-7 min-w-[28px] rounded-lg bg-primary/8 text-primary text-[11px] font-semibold mt-0.5 shrink-0">
                    {result.verse_key}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Arabic */}
                    <p
                      className="text-base leading-[2] text-foreground line-clamp-2"
                      dir="rtl"
                      style={{ fontFamily: "'Amiri Quran', 'Amiri', 'Scheherazade New', serif" }}
                    >
                      {result.text}
                    </p>
                    {/* Translation highlight */}
                    {result.translations?.[0]?.text && (
                      <p
                        className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(result.translations[0].text),
                        }}
                      />
                    )}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground mt-2 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
