import {
  MapPin,
  RefreshCw,
  Clock,
  Sunrise,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { Button, Card, CardContent, Skeleton } from "@template/ui";
import { AppHeader } from "@/components/layout/app-header";
import { usePrayerTimes } from "@/lib/hooks/use-prayer-times";
import { cn } from "@/lib/utils";
import { useTranslation, type TranslationKey } from "@/lib/i18n";

const PRAYER_ICONS: Record<string, React.ElementType> = {
  Fajr: Sunrise,
  Sunrise: Sun,
  Dhuhr: Sun,
  Asr: Sun,
  Maghrib: Sunset,
  Isha: Moon,
};

const PRAYER_LABEL_KEYS: Record<string, TranslationKey> = {
  Fajr: "fajr",
  Sunrise: "sunrise",
  Dhuhr: "dhuhr",
  Asr: "asr",
  Maghrib: "maghrib",
  Isha: "isha",
};

export default function PrayerTimesPage() {
  const { t } = useTranslation();
  const {
    times,
    nextPrayer,
    countdown,
    loading,
    error,
    location,
    hijriDate,
    gregorianDate,
    refresh,
  } = usePrayerTimes();

  return (
    <div className="animate-fade-in">
      <AppHeader
        title={t("prayerTimes")}
        showBack
        rightContent={
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-2xl text-muted-foreground hover:bg-secondary"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        }
      />

      <div className="px-6 pb-8 space-y-6">
        {/* Location + Date */}
        {location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>
              {location.city}
              {location.country ? `, ${location.country}` : ""}
            </span>
          </div>
        )}

        {/* Hijri Date */}
        {hijriDate && (
          <div className="text-center py-1">
            <p className="text-xl font-bold text-foreground">
              {hijriDate.fullDate} {hijriDate.designation}
            </p>
            {gregorianDate && (
              <p className="text-sm text-muted-foreground mt-1">
                {gregorianDate}
              </p>
            )}
          </div>
        )}

        {/* Next Prayer */}
        {nextPrayer && times && (
          <Card className="overflow-hidden border-0 shadow-card rounded-2xl">
            <CardContent className="p-0">
              <div className="relative px-6 py-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-primary/3" />
                <div className="relative text-center">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t("nextPrayerLabel")}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {t(PRAYER_LABEL_KEYS[nextPrayer])}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {times[nextPrayer]}
                  </p>
                  {countdown && (
                    <p className="text-xl font-bold text-primary mt-3 tabular-nums font-mono">
                      {countdown}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && !times && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-2xl" />
                  <Skeleton className="h-4 w-20 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !times && (
          <Card className="border-0 shadow-card rounded-2xl">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                className="mt-4 rounded-2xl"
                onClick={refresh}
              >
                {t("tryAgain")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* All Prayer Times */}
        {times && (
          <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              {Object.entries(times).map(([prayer, time]) => {
                const Icon = PRAYER_ICONS[prayer] || Clock;
                const isNext = prayer === nextPrayer;
                return (
                  <div
                    key={prayer}
                    className={cn(
                      "flex items-center justify-between px-5 py-4 transition-colors border-b border-border/20 last:border-0",
                      isNext && "bg-primary/[0.04]",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-2xl shrink-0",
                          isNext
                            ? "bg-primary/12 text-primary"
                            : "bg-secondary/60 text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <span
                        className={cn(
                          "text-sm",
                          isNext
                            ? "font-bold text-foreground"
                            : "font-medium text-foreground",
                        )}
                      >
                        {PRAYER_LABEL_KEYS[prayer]
                          ? t(PRAYER_LABEL_KEYS[prayer])
                          : prayer}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-sm tabular-nums",
                        isNext
                          ? "font-bold text-primary"
                          : "font-medium text-muted-foreground",
                      )}
                    >
                      {time}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
