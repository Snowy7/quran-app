import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import { Button } from '@template/ui';
import { usePrayerTimes, usePrayerNotifications, useOfflineReadingProgress, useOfflineSettings, useReadingHistory } from '@/lib/hooks';
import { PrayerHero, DailyVerse, QuickActions, PrayerTimesCards, DailyStats, HifzWidget } from '@/components/home';
import { useSidebarContext } from '@/components/layout/app-layout';
import { useTranslation } from '@/lib/i18n';

export default function HomePage() {
  const sidebar = useSidebarContext();
  const { t, isRTL } = useTranslation();
  const { times: prayerTimes } = usePrayerTimes();
  const { scheduleNotifications, isPermitted, settings: notificationSettings } = usePrayerNotifications(prayerTimes);
  const { progress } = useOfflineReadingProgress();
  const { history } = useReadingHistory();
  const { settings } = useOfflineSettings();

  useEffect(() => {
    if (prayerTimes && isPermitted && notificationSettings.enabled) {
      scheduleNotifications(prayerTimes);
    }
  }, [prayerTimes, isPermitted, notificationSettings.enabled, scheduleNotifications]);

  const todayAyahs = history?.totalAyahs || 0;
  const dailyGoal = settings.dailyAyahGoal || 10;

  return (
    <div className="page-container min-h-screen">
      {/* App Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm safe-area-top">
        <div className="flex items-center justify-between px-5 py-3 md:px-8">
          {/* LTR: Search left, Title+Menu right | RTL: Menu+Title left, Search right */}
          {isRTL ? (
            <>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary hover:bg-primary/10 lg:hidden"
                  onClick={sidebar.open}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <h1 className="font-arabic-ui text-xl font-bold text-primary">
                  {t('noor')}
                </h1>
              </div>
              <Link to="/search">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary hover:bg-primary/10"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/search">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary hover:bg-primary/10"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="font-arabic-ui text-xl font-bold text-primary">
                  {t('noor')}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary hover:bg-primary/10 lg:hidden"
                  onClick={sidebar.open}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="px-5 pb-6 md:px-8 lg:pb-10">
        {/* Top section: Prayer Hero + Daily Verse side by side on tablet+ */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-5">
          <div className="md:flex-1">
            <PrayerHero />
          </div>
          <div className="md:flex-1">
            <DailyVerse />
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mt-5 md:mt-6 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <h2 className="text-sm md:text-base font-medium text-muted-foreground mb-3 font-arabic-ui">
            {t('quickAccess')}
          </h2>
          <QuickActions />
        </section>

        {/* Prayer Times Cards */}
        <section className="mt-5 md:mt-6 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
          <h2 className="text-sm md:text-base font-medium text-muted-foreground mb-3 font-arabic-ui">
            {t('prayerTimes')}
          </h2>
          <PrayerTimesCards />
        </section>

        {/* Daily Stats + Hifz side by side on tablet+ */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-5 mt-5 md:mt-6">
          <section className="md:flex-1 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <h2 className="text-sm md:text-base font-medium text-muted-foreground mb-3 font-arabic-ui">
              {t('todaysProgress')}
            </h2>
            <DailyStats
              streak={progress.currentStreak}
              todayAyahs={todayAyahs}
              dailyGoal={dailyGoal}
            />
          </section>
          <section className="md:flex-1 animate-slide-up" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
            <h2 className="text-sm md:text-base font-medium text-muted-foreground mb-3 font-arabic-ui">
              {t('memorization')}
            </h2>
            <HifzWidget />
          </section>
        </div>
      </div>
    </div>
  );
}
