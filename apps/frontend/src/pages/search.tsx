import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, ChevronRight, Clock } from 'lucide-react';
import { Input, Button, Card, CardContent } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { searchQuran } from '@/lib/api/quran-api';
import { SURAHS, searchSurahs, getSurahById } from '@/data/surahs';
import { useDebouncedCallback } from '@/lib/utils';

interface SearchResult {
  surahId: number;
  ayahNumber: number;
  text: string;
  matchedText: string;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search
  const performSearch = useDebouncedCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Check if it's a verse reference (e.g., "2:255")
      const verseMatch = searchQuery.match(/^(\d+):(\d+)$/);
      if (verseMatch) {
        const surahId = parseInt(verseMatch[1], 10);
        const ayahNumber = parseInt(verseMatch[2], 10);
        const surah = getSurahById(surahId);
        if (surah && ayahNumber <= surah.numberOfAyahs) {
          navigate(`/quran/${surahId}`);
          return;
        }
      }

      // Search in translations
      const searchResults = await searchQuran(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    performSearch(value);
  };

  const matchedSurahs = query.length >= 2 ? searchSurahs(query).slice(0, 5) : [];

  return (
    <div className="page-container">
      <AppHeader title="Search" showBack showSearch={false} />

      <main className="px-4 py-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search surahs, verses, or type 2:255..."
            className="pl-10 pr-10"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => {
                setQuery('');
                setResults([]);
                setHasSearched(false);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Surah Matches */}
        {matchedSurahs.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">Surahs</h2>
            {matchedSurahs.map((surah) => (
              <Link key={surah.id} to={`/quran/${surah.id}`}>
                <Card className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-medium">
                        {surah.id}
                      </div>
                      <div>
                        <p className="font-medium">{surah.englishName}</p>
                        <p className="text-xs text-muted-foreground">
                          {surah.englishNameTranslation}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="arabic-text">{surah.name}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {/* Search Results */}
        {!isSearching && results.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Verses ({results.length})
            </h2>
            {results.map((result, index) => {
              const surah = getSurahById(result.surahId);
              return (
                <Link key={index} to={`/quran/${result.surahId}`}>
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">
                          {surah?.englishName || `Surah ${result.surahId}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {result.surahId}:{result.ayahNumber}
                        </span>
                      </div>
                      <p
                        className="text-sm text-muted-foreground line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: result.matchedText }}
                      />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {!isSearching && hasSearched && results.length === 0 && matchedSurahs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No results found for "{query}"</p>
          </div>
        )}

        {/* Quick Tips */}
        {!hasSearched && (
          <div className="space-y-4 pt-4">
            <h2 className="text-sm font-medium text-muted-foreground">Search Tips</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Search by surah name: "Al-Fatihah" or "الفاتحة"</p>
              <p>• Jump to a verse: "2:255" or "36:1"</p>
              <p>• Search by meaning: "mercy" or "guidance"</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
