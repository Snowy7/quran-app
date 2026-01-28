import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, MapPin } from 'lucide-react';
import { Input, Card, CardContent, Badge } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { SURAHS, searchSurahs } from '@/data/surahs';
import { useSurahMemorization } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export default function QuranIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSurahs = useMemo(() => {
    return searchSurahs(searchQuery);
  }, [searchQuery]);

  return (
    <div className="page-container">
      <AppHeader title="Quran" showSearch={false} />

      <main className="px-4 py-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search surahs..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Surah List */}
        <div className="space-y-2">
          {filteredSurahs.map((surah) => (
            <SurahCard key={surah.id} surah={surah} />
          ))}
        </div>

        {filteredSurahs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No surahs found</p>
          </div>
        )}
      </main>
    </div>
  );
}

interface SurahCardProps {
  surah: typeof SURAHS[0];
}

function SurahCard({ surah }: SurahCardProps) {
  const { status, percentage } = useSurahMemorization(surah.id);

  const statusColors = {
    not_started: '',
    learning: 'border-l-4 border-l-amber-500',
    memorized: 'border-l-4 border-l-green-500',
    needs_revision: 'border-l-4 border-l-orange-500',
  };

  return (
    <Link to={`/quran/${surah.id}`}>
      <Card className={cn(
        'hover:border-primary/30 transition-colors',
        statusColors[status]
      )}>
        <CardContent className="p-3 flex items-center gap-3">
          {/* Surah Number */}
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary text-sm font-semibold shrink-0">
            {surah.id}
          </div>

          {/* Surah Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{surah.englishName}</h3>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {surah.revelationType}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {surah.englishNameTranslation} - {surah.numberOfAyahs} verses
            </p>
          </div>

          {/* Arabic Name & Progress */}
          <div className="flex items-center gap-3 shrink-0">
            {status !== 'not_started' && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  {Math.round(percentage)}%
                </div>
              </div>
            )}
            <span className="arabic-text text-xl">{surah.name}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
