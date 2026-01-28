import { Link } from 'react-router-dom';
import { Book, BookMarked, GraduationCap, ChevronRight, Flame, Clock, Target } from 'lucide-react';
import { Button, Card, CardContent, Progress } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { useOfflineReadingProgress, useReadingHistory } from '@/lib/hooks';
import { useOfflineSettings } from '@/lib/hooks';
import { getSurahById } from '@/data/surahs';
import { formatDistanceToNow } from 'date-fns';

export default function HomePage() {
  const { progress } = useOfflineReadingProgress();
  const { history } = useReadingHistory();
  const { settings } = useOfflineSettings();

  const lastSurah = getSurahById(progress.lastSurahId);
  const todayAyahs = history?.totalAyahs || 0;
  const goalProgress = settings.dailyAyahGoal > 0
    ? Math.min((todayAyahs / settings.dailyAyahGoal) * 100, 100)
    : 0;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="page-container">
      <AppHeader showSearch={true} />

      <main className="px-4 py-6 space-y-6">
        {/* Greeting */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Assalamu Alaikum
          </h1>
          <p className="text-muted-foreground">
            {getGreeting()}
          </p>
        </div>

        {/* Continue Reading Card */}
        {lastSurah && (
          <Link to={`/quran/${progress.lastSurahId}`}>
            <Card className="overflow-hidden border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex-1 p-4">
                    <p className="text-sm text-muted-foreground mb-1">Continue Reading</p>
                    <h2 className="text-lg font-semibold mb-1">
                      {lastSurah.englishName}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Verse {progress.lastAyahNumber} of {lastSurah.numberOfAyahs}
                    </p>
                    {progress.lastReadDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last read {formatDistanceToNow(progress.lastReadDate, { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-center w-20 bg-primary/10">
                    <span className="arabic-text text-3xl text-primary">
                      {lastSurah.name}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-orange-500/10">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">{progress.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/10">
                <Book className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{todayAyahs}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-green-500/10">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{formatTime(history?.totalTimeMs || 0)}</p>
              <p className="text-xs text-muted-foreground">Time</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Goal Progress */}
        {settings.dailyAyahGoal > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Daily Goal</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {todayAyahs} / {settings.dailyAyahGoal} ayahs
                </span>
              </div>
              <Progress value={goalProgress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Quick Access
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <Link to="/quran">
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                    <Book className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Quran</p>
                    <p className="text-xs text-muted-foreground">114 Surahs</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/bookmarks">
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10">
                    <BookMarked className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">Bookmarks</p>
                    <p className="text-xs text-muted-foreground">Saved verses</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/memorize">
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/10">
                    <GraduationCap className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Memorize</p>
                    <p className="text-xs text-muted-foreground">Hifz tracker</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/quran/36">
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10">
                    <span className="arabic-text text-lg text-purple-500">يس</span>
                  </div>
                  <div>
                    <p className="font-medium">Ya-Sin</p>
                    <p className="text-xs text-muted-foreground">Heart of Quran</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Featured Surahs */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Popular Surahs
          </h2>

          <div className="space-y-2">
            {[1, 18, 36, 55, 67].map((id) => {
              const surah = getSurahById(id);
              if (!surah) return null;
              return (
                <Link key={id} to={`/quran/${id}`}>
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-sm font-medium">
                          {surah.id}
                        </div>
                        <div>
                          <p className="font-medium">{surah.englishName}</p>
                          <p className="text-xs text-muted-foreground">
                            {surah.englishNameTranslation} - {surah.numberOfAyahs} verses
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="arabic-text text-lg">{surah.name}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Start your day with the Quran';
  if (hour < 17) return 'May your afternoon be blessed';
  if (hour < 20) return 'Evening reflection time';
  return 'End your day with remembrance';
}
