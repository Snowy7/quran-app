import { useEffect } from 'react';
import { Menu, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@template/ui';
import { useOfflineReadingProgress, usePrayerTimes, usePrayerNotifications } from '@/lib/hooks';
import { Logo } from '@/components/brand/logo';
import { PrayerHero, QuickActions, PrayerTimesCards, HifzWidget, DailyStats } from '@/components/home';
import { useSidebarContext } from '@/components/layout/app-layout';
import { useOfflineSettings, useReadingHistory } from '@/lib/hooks';

export default function HomePage() {
  const { progress } = useOfflineReadingProgress();
  const { history } = useReadingHistory();
  const { settings } = useOfflineSettings();
  const sidebar = useSidebarContext();
  const { times: prayerTimes } = usePrayerTimes();

  // Initialize prayer notifications (this will schedule them automatically)
  const { scheduleNotifications, isPermitted, settings: notificationSettings } = usePrayerNotifications(prayerTimes);

  // Re-schedule notifications when prayer times update
  useEffect(() => {
    if (prayerTimes && isPermitted && notificationSettings.enabled) {
      scheduleNotifications(prayerTimes);
    }
  }, [prayerTimes, isPermitted, notificationSettings.enabled, scheduleNotifications]);

  const todayAyahs = history?.totalAyahs || 0;
  const dailyGoal = settings.dailyAyahGoal || 10;

  return (
    <div className="page-container min-h-screen">
      {/* Header - fixed at top, transparent */}
      <div className="fixed top-0 left-0 right-0 z-50 safe-area-top">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 -ml-1 text-amber-900 hover:bg-amber-900/10 dark:text-amber-100 dark:hover:bg-amber-100/10"
              onClick={sidebar.open}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="font-semibold text-lg text-amber-900 dark:text-amber-100">Noor</span>
            </div>
          </div>
          <Link to="/search">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-amber-900 hover:bg-amber-900/10 dark:text-amber-100 dark:hover:bg-amber-100/10"
            >
              <Search className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content - add padding for fixed header */}
      <div className="px-5 pb-6">
        {/* Prayer Hero - Main focal point */}
        <div className="animate-fade-in">
          <PrayerHero />
        </div>

        {/* Quick Access */}
        <section className="mt-4 animate-slide-up" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Quick Access</h2>
          <QuickActions />
        </section>

        {/* Prayer Times Cards */}
        <section className="mt-6 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Prayer Times</h2>
          <PrayerTimesCards />
        </section>

        {/* Daily Stats */}
        <section className="mt-6 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Today's Progress</h2>
          <DailyStats
            streak={progress.currentStreak}
            todayAyahs={todayAyahs}
            dailyGoal={dailyGoal}
          />
        </section>

        {/* Hifz Progress */}
        <section className="mt-6 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <HifzWidget />
        </section>
      </div>
    </div>
  );
}
