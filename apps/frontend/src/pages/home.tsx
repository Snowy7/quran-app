import { Menu } from 'lucide-react';
import { Button } from '@template/ui';
import { useOfflineReadingProgress, useReadingHistory, useOfflineSettings } from '@/lib/hooks';
import { Logo } from '@/components/brand/logo';
import { HeroCard, PrayerTimesWidget, QuickActions, HifzWidget, DailyStats } from '@/components/home';
import { useSidebarContext } from '@/components/layout/app-layout';

export default function HomePage() {
  const { progress } = useOfflineReadingProgress();
  const { history } = useReadingHistory();
  const { settings } = useOfflineSettings();
  const sidebar = useSidebarContext();

  const todayAyahs = history?.totalAyahs || 0;
  const dailyGoal = settings.dailyAyahGoal || 10;

  return (
    <div className="page-container relative">
      {/* Atmospheric gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-48 -left-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-24 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl" />
      </div>

      <div className="relative px-5 pt-8 pb-6">
        {/* Header with gradient overlay */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 -ml-1"
              onClick={sidebar.open}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Logo size="sm" />
            <div>
              <p className="text-xs text-muted-foreground">Assalamu Alaikum</p>
              <h1 className="text-xl font-semibold">Noor</h1>
            </div>
          </div>
        </div>

        {/* Hero Card - Continue Reading */}
        <div className="mb-6">
          <HeroCard
            lastSurahId={progress.lastSurahId}
            lastAyahNumber={progress.lastAyahNumber}
          />
        </div>

        {/* Prayer Times Widget */}
        <div className="mb-6">
          <PrayerTimesWidget />
        </div>

        {/* Daily Stats */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Today's Progress</h2>
          <DailyStats
            streak={progress.currentStreak}
            todayAyahs={todayAyahs}
            dailyGoal={dailyGoal}
          />
        </div>

        {/* Hifz Progress Widget */}
        <div className="mb-6">
          <HifzWidget />
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Quick Access</h2>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
