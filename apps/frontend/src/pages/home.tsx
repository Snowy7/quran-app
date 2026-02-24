import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import { Button } from '@template/ui';
import { usePrayerTimes, usePrayerNotifications, useOfflineReadingProgress, useOfflineSettings, useReadingHistory } from '@/lib/hooks';
import { PrayerHero, DailyVerse, QuickActions, PrayerTimesCards, DailyStats, HifzWidget, RamadanBanner } from '@/components/home';
import { useSidebarContext } from '@/components/layout/app-layout';
import { useTranslation } from '@/lib/i18n';
import { SURAHS } from '@/data/surahs';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const sidebar = useSidebarContext();
  const { t, isRTL } = useTranslation();
  const { times: prayerTimes, hijriDate } = usePrayerTimes();
  const { scheduleNotifications, isPermitted, settings: notificationSettings } = usePrayerNotifications(prayerTimes);
  const { progress } = useOfflineReadingProgress();
  const { history } = useReadingHistory();
  const { settings } = useOfflineSettings();

  // Ramadan detection — Hijri month 9 is Ramadan
  const isRamadan = hijriDate?.monthNumber === 9;
  const ramadanDay = isRamadan ? parseInt(hijriDate.day, 10) || 1 : 0;

  useEffect(() => {
    if (prayerTimes && isPermitted && notificationSettings.enabled) {
      scheduleNotifications(prayerTimes);
    }
  }, [
    prayerTimes,
    isPermitted,
    notificationSettings.enabled,
    scheduleNotifications,
  ]);

  const todayAyahs = history?.totalAyahs || 0;
  const dailyGoal = settings.dailyAyahGoal || 10;

  const lastSurah = progress?.lastSurahId
    ? SURAHS.find((s) => s.id === progress.lastSurahId)
    : null;

  return (
    <div className="page-container min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* App Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm safe-area-top">
        <div className="flex items-center justify-between px-5 py-3 md:px-8">
          <div className="flex items-center gap-3">
            {isRTL && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-primary hover:bg-primary/10 lg:hidden"
                onClick={sidebar.open}
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            {!isRTL && (
              <Link to="/search">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary hover:bg-primary/10"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>

          <h1 className="font-arabic-ui text-xl font-bold text-primary">
            {t('noor')}
          </h1>

          <div className="flex items-center gap-3">
            {isRTL && (
              <Link to="/search">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary hover:bg-primary/10"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </Link>
            )}
            {!isRTL && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-primary hover:bg-primary/10 lg:hidden"
                onClick={sidebar.open}
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-5 pb-6 md:px-8 lg:pb-10">
        {/* Top hero section */}
        <div className="animate-fade-in">
          <PrayerHero />
        </div>

        {/* Ramadan Banner — only shown during Ramadan */}
        {isRamadan && prayerTimes && (
          <div
            className="mt-4 animate-slide-up"
            style={{ animationDelay: '20ms', animationFillMode: 'both' }}
          >
            <RamadanBanner
              hijriDay={ramadanDay}
              suhoorTime={prayerTimes.Fajr}
              iftarTime={prayerTimes.Maghrib}
            />
          </div>
        )}

        {/* Daily Verse Carousel */}
        <div className="mt-5 md:mt-6">
          <DailyVerse />
        </div>

        {/* Quick Actions */}
        <section
          className="mt-6 md:mt-8 animate-slide-up"
          style={{ animationDelay: '100ms', animationFillMode: 'both' }}
        >
          <SectionHeading>{t('quickAccess')}</SectionHeading>
          <QuickActions />
        </section>

        {/* Prayer Times Cards */}
        <section
          className="mt-6 md:mt-8 animate-slide-up"
          style={{ animationDelay: '150ms', animationFillMode: 'both' }}
        >
          <SectionHeading>{t('prayerTimes')}</SectionHeading>
          <PrayerTimesCards />
        </section>

        {/* Stats + Hifz */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mt-6 md:mt-8">
          <section
            className="animate-slide-up"
            style={{ animationDelay: '200ms', animationFillMode: 'both' }}
          >
            <SectionHeading>{t('todaysProgress')}</SectionHeading>
            <DailyStats
              streak={progress.currentStreak}
              todayAyahs={todayAyahs}
              dailyGoal={dailyGoal}
            />
          </section>
          <section
            className="animate-slide-up"
            style={{ animationDelay: '250ms', animationFillMode: 'both' }}
          >
            <SectionHeading>{t('memorization')}</SectionHeading>
            <HifzWidget />
          </section>
        </div>
      </div>
    </div>
  );
}

/** Small reusable section heading */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs md:text-sm font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3 font-arabic-ui">
      {children}
    </h2>
  );
}
