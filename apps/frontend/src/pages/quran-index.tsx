import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input, Tabs, TabsContent, TabsList, TabsTrigger } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { SurahList } from '@/components/quran/surah-list';
import { JuzList } from '@/components/quran/juz-list';
import { useChapters } from '@/lib/api/chapters';
import { Link } from 'react-router-dom';

function PageGrid() {
  return (
    <div className="grid grid-cols-6 gap-2 px-5 py-3">
      {Array.from({ length: 604 }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          to={`/quran/page/${page}`}
          className="flex items-center justify-center h-10 rounded-lg bg-secondary/50 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
        >
          {page}
        </Link>
      ))}
    </div>
  );
}

export default function QuranIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: chapters, isLoading } = useChapters();

  return (
    <div>
      <AppHeader title="Quran" />

      {/* Search bar */}
      <div className="px-5 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search surahs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-secondary/50 border-0"
          />
        </div>
      </div>

      {/* Browse tabs */}
      <Tabs defaultValue="surah" className="w-full">
        <div className="px-5">
          <TabsList className="w-full bg-secondary/50">
            <TabsTrigger value="surah" className="flex-1">
              Surah
            </TabsTrigger>
            <TabsTrigger value="juz" className="flex-1">
              Juz
            </TabsTrigger>
            <TabsTrigger value="page" className="flex-1">
              Page
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="surah" className="mt-2">
          <SurahList
            chapters={chapters}
            isLoading={isLoading}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="juz" className="mt-2">
          <JuzList />
        </TabsContent>

        <TabsContent value="page" className="mt-2">
          <PageGrid />
        </TabsContent>
      </Tabs>
    </div>
  );
}
