import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, ArrowLeft } from 'lucide-react';
import { Input } from '@template/ui';
import { SURAHS, searchSurahs } from '@/data/surahs';

export default function QuranIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSurahs = useMemo(() => {
    return searchSurahs(searchQuery);
  }, [searchQuery]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold">Quran</h1>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search surahs..."
              className="pl-10 bg-secondary border-0"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Surah List */}
      <div className="divide-y divide-border">
        {filteredSurahs.map((surah) => (
          <Link
            key={surah.id}
            to={`/quran/${surah.id}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
              {surah.id}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{surah.englishName}</p>
              <p className="text-sm text-muted-foreground">
                {surah.englishNameTranslation} · {surah.numberOfAyahs} verses
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="arabic-text text-lg">{surah.name}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>

      {filteredSurahs.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No surahs found</p>
        </div>
      )}
    </div>
  );
}
