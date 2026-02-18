import { useEffect } from "react";
import { Menu, Search, BookOpen, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@template/ui";
import {
  useOfflineReadingProgress,
  usePrayerTimes,
  usePrayerNotifications,
} from "@/lib/hooks";
import { Logo } from "@/components/brand/logo";
import {
  PrayerHero,
  QuickActions,
  PrayerTimesCards,
  HifzWidget,
  DailyStats,
} from "@/components/home";
import { RamadanBanner } from "@/components/home/ramadan-banner";
import { useSidebarContext } from "@/components/layout/app-layout";
import { useOfflineSettings, useReadingHistory } from "@/lib/hooks";
import { SURAHS } from "@/data/surahs";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { progress } = useOfflineReadingProgress();
  const { history } = useReadingHistory();
  const { settings } = useOfflineSettings();
  const sidebar = useSidebarContext();
  const { times: prayerTimes, hijriDate } = usePrayerTimes();

  // Ramadan detection — Hijri month 9 is Ramadan
  const isRamadan = hijriDate?.monthNumber === 9;
  const ramadanDay = isRamadan ? parseInt(hijriDate.day, 10) || 1 : 0;

  // Initialize prayer notifications
  const {
    scheduleNotifications,
    isPermitted,
    settings: notificationSettings,
  } = usePrayerNotifications(prayerTimes);

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
    <div className="page-container min-h-screen">
      {/* ── Header — fixed, transparent ── */}
      <div className="fixed top-0 left-0 right-0 z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
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
              <span className="font-semibold text-base text-amber-900 dark:text-amber-100">
                Noor
              </span>
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

      {/* ── Main Content ── */}
      <div className="px-4 pb-6">
        {/* Prayer Hero */}
        <div className="animate-fade-in">
          <PrayerHero />
        </div>

        {/* Ramadan Banner — only shown during Ramadan */}
        {isRamadan && prayerTimes && (
          <div
            className="mb-4 animate-slide-up"
            style={{ animationDelay: "20ms", animationFillMode: "both" }}
          >
            <RamadanBanner
              hijriDay={ramadanDay}
              suhoorTime={prayerTimes.Fajr}
              iftarTime={prayerTimes.Maghrib}
            />
          </div>
        )}

        {/* Continue Reading — prominent card */}
        <Link
          to={lastSurah ? `/quran/${lastSurah.id}` : "/quran/1"}
          className="block mt-1 mb-5 animate-slide-up"
          style={{ animationDelay: "30ms", animationFillMode: "both" }}
        >
          <div className="relative rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg active:scale-[0.995]">
            {/* Gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, hsl(32 80% 44%) 0%, hsl(28 75% 38%) 50%, hsl(24 70% 32%) 100%)",
              }}
            />
            {/* Pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "16px 16px",
              }}
            />

            <div className="relative z-10 flex items-center justify-between px-5 py-4">
              <div className="min-w-0">
                <p className="text-amber-200/60 text-[9px] font-semibold uppercase tracking-[0.15em] mb-1">
                  Continue Reading
                </p>
                <h2 className="text-white text-lg font-bold leading-tight mb-0.5">
                  {lastSurah?.englishName || "Al-Fatihah"}
                </h2>
                <div className="flex items-center gap-1.5 text-amber-100/70 text-[11px]">
                  <span className="arabic-text text-xs leading-none">
                    {lastSurah?.name ||
                      "\u0627\u0644\u0641\u0627\u062A\u062D\u0629"}
                  </span>
                  <span className="text-amber-200/30">&middot;</span>
                  <span>Ayah {progress?.lastAyahNumber || 1}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 ml-3">
                <BookOpen className="w-5 h-5 text-white/80" />
              </div>
            </div>
          </div>
        </Link>

        {/* Quick Actions */}
        <section
          className="mb-5 animate-slide-up"
          style={{ animationDelay: "60ms", animationFillMode: "both" }}
        >
          <QuickActions />
        </section>

        {/* Prayer Times */}
        <section
          className="mb-5 animate-slide-up"
          style={{ animationDelay: "90ms", animationFillMode: "both" }}
        >
          <SectionHeader title="Prayer Times" to="/prayer-times" />
          <PrayerTimesCards />
        </section>

        {/* Daily Stats */}
        <section
          className="mb-5 animate-slide-up"
          style={{ animationDelay: "120ms", animationFillMode: "both" }}
        >
          <SectionHeader title="Today's Progress" />
          <DailyStats
            streak={progress.currentStreak}
            todayAyahs={todayAyahs}
            dailyGoal={dailyGoal}
          />
        </section>

        {/* Hifz Progress */}
        <section
          className="animate-slide-up"
          style={{ animationDelay: "150ms", animationFillMode: "both" }}
        >
          <SectionHeader title="Memorization" to="/memorize" />
          <HifzWidget />
        </section>
      </div>
    </div>
  );
}

// ── Section Header helper ──

function SectionHeader({ title, to }: { title: string; to?: string }) {
  const inner = (
    <div className="flex items-center justify-between mb-2.5">
      <h2 className="text-[13px] font-semibold text-foreground/70">{title}</h2>
      {to && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {inner}
      </Link>
    );
  }

  return inner;
}
