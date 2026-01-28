import { Link } from 'react-router-dom';
import { Play, ChevronRight } from 'lucide-react';
import { Button } from '@template/ui';
import { useOfflineReadingProgress, useReadingHistory, useOfflineSettings } from '@/lib/hooks';
import { getSurahById, SURAHS } from '@/data/surahs';
import { SyncStatus } from '@/components/sync/sync-status';

export default function HomePage() {
  const { progress } = useOfflineReadingProgress();
  const { history } = useReadingHistory();
  const { settings } = useOfflineSettings();

  const lastSurah = getSurahById(progress.lastSurahId);
  const todayAyahs = history?.totalAyahs || 0;
  const dailyGoal = settings.dailyAyahGoal || 10;
  const goalPercent = Math.min(Math.round((todayAyahs / dailyGoal) * 100), 100);

  return (
    <div className="page-container">
      <div className="px-5 pt-12 pb-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Assalamu Alaikum</p>
            <h1 className="text-2xl font-semibold">Noor</h1>
          </div>
          <SyncStatus showLabel />
        </div>

        {/* Continue Reading */}
        {lastSurah && (
          <Link to={`/quran/${progress.lastSurahId}`} className="block mb-8">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary text-primary-foreground">
              <div>
                <p className="text-sm opacity-80 mb-1">Continue</p>
                <p className="font-medium">{lastSurah.englishName}</p>
                <p className="text-sm opacity-80">
                  Verse {progress.lastAyahNumber}
                </p>
              </div>
              <Button
                size="icon"
                variant="secondary"
                className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <Play className="h-5 w-5 ml-0.5" />
              </Button>
            </div>
          </Link>
        )}

        {/* Stats Row */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 p-4 rounded-xl bg-secondary">
            <p className="text-2xl font-semibold">{progress.currentStreak}</p>
            <p className="text-sm text-muted-foreground">Day streak</p>
          </div>
          <div className="flex-1 p-4 rounded-xl bg-secondary">
            <p className="text-2xl font-semibold">{todayAyahs}</p>
            <p className="text-sm text-muted-foreground">Today</p>
          </div>
          <div className="flex-1 p-4 rounded-xl bg-secondary">
            <p className="text-2xl font-semibold">{goalPercent}%</p>
            <p className="text-sm text-muted-foreground">Goal</p>
          </div>
        </div>

        {/* Quick Access */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Quick Access</h2>
            <Link to="/quran" className="text-sm text-primary">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 36, 67, 112].map((id) => {
              const surah = getSurahById(id);
              if (!surah) return null;
              return (
                <Link
                  key={id}
                  to={`/quran/${id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="arabic-text text-lg">{surah.name.slice(0, 2)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{surah.englishName}</p>
                    <p className="text-xs text-muted-foreground">{surah.numberOfAyahs} verses</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent */}
        <div>
          <h2 className="font-medium mb-4">All Surahs</h2>
          <div className="space-y-1">
            {SURAHS.slice(0, 10).map((surah) => (
              <Link
                key={surah.id}
                to={`/quran/${surah.id}`}
                className="flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-secondary/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {surah.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{surah.englishName}</p>
                  <p className="text-sm text-muted-foreground">
                    {surah.englishNameTranslation}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="arabic-text text-lg">{surah.name}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
          <Link
            to="/quran"
            className="block text-center py-4 text-sm text-primary font-medium"
          >
            View all 114 surahs
          </Link>
        </div>
      </div>
    </div>
  );
}
