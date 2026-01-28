import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, CheckCircle, BookOpen, AlertCircle, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent, Progress, Badge } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { useOfflineMemorization, useSurahMemorization } from '@/lib/hooks';
import { SURAHS } from '@/data/surahs';
import type { MemorizationStatus } from '@/types/quran';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | MemorizationStatus;

const tabs: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'memorized', label: 'Memorized' },
  { id: 'learning', label: 'Learning' },
  { id: 'needs_revision', label: 'Review' },
];

export default function MemorizePage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const { memorizations, stats, isLoading } = useOfflineMemorization();

  const getMemorizationForSurah = (surahId: number) => {
    return memorizations.find((m) => m.surahId === surahId);
  };

  const filteredSurahs = SURAHS.filter((surah) => {
    if (activeTab === 'all') return true;
    const mem = getMemorizationForSurah(surah.id);
    if (activeTab === 'not_started') return !mem || mem.status === 'not_started';
    return mem?.status === activeTab;
  });

  const overallProgress = ((stats.memorized / 114) * 100).toFixed(1);

  return (
    <div className="page-container">
      <AppHeader title="Memorization" showSearch={false} />

      <main className="px-4 py-4 space-y-6">
        {/* Stats Overview */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="6"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(stats.memorized / 114) * 226.2} 226.2`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{stats.memorized}</span>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">Hifz Progress</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  {stats.memorized} of 114 surahs memorized
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <p className="text-lg font-semibold text-green-600">{stats.memorized}</p>
                    <p className="text-[10px] text-muted-foreground">Done</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <p className="text-lg font-semibold text-amber-600">{stats.learning}</p>
                    <p className="text-[10px] text-muted-foreground">Learning</p>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <p className="text-lg font-semibold text-orange-600">{stats.needsRevision}</p>
                    <p className="text-[10px] text-muted-foreground">Review</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              size="sm"
              className="shrink-0"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Surah List */}
        <div className="space-y-2">
          {filteredSurahs.map((surah) => (
            <SurahMemorizationCard
              key={surah.id}
              surah={surah}
              memorization={getMemorizationForSurah(surah.id)}
            />
          ))}
        </div>

        {filteredSurahs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No surahs in this category</p>
          </div>
        )}
      </main>
    </div>
  );
}

interface SurahMemorizationCardProps {
  surah: typeof SURAHS[0];
  memorization?: ReturnType<typeof useOfflineMemorization>['memorizations'][0];
}

function SurahMemorizationCard({ surah, memorization }: SurahMemorizationCardProps) {
  const status = memorization?.status || 'not_started';
  const memorizedCount = memorization?.memorizedAyahs.length || 0;
  const percentage = (memorizedCount / surah.numberOfAyahs) * 100;

  const statusConfig = {
    not_started: {
      icon: BookOpen,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
      label: 'Not Started',
    },
    learning: {
      icon: BookOpen,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
      label: 'Learning',
    },
    memorized: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-500/10',
      label: 'Memorized',
    },
    needs_revision: {
      icon: AlertCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-500/10',
      label: 'Needs Review',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Link to={`/quran/${surah.id}`}>
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bg)}>
              <Icon className={cn('w-5 h-5', config.color)} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{surah.englishName}</h3>
                <Badge variant="secondary" className="text-[10px]">
                  {surah.numberOfAyahs}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={percentage} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground shrink-0">
                  {memorizedCount}/{surah.numberOfAyahs}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="arabic-text text-lg">{surah.name}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
