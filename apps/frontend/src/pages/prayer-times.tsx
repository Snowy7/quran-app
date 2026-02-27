import { MapPin, RefreshCw, Clock, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { Button, Card, CardContent, Skeleton } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { usePrayerTimes } from '@/lib/hooks/use-prayer-times';
import { cn } from '@/lib/utils';

const PRAYER_ICONS: Record<string, React.ElementType> = {
  Fajr: Sunrise,
  Sunrise: Sun,
  Dhuhr: Sun,
  Asr: Sun,
  Maghrib: Sunset,
  Isha: Moon,
};

const PRAYER_LABELS: Record<string, string> = {
  Fajr: 'Fajr',
  Sunrise: 'Sunrise',
  Dhuhr: 'Dhuhr',
  Asr: 'Asr',
  Maghrib: 'Maghrib',
  Isha: 'Isha',
};

export default function PrayerTimesPage() {
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
    <div>
      <AppHeader
        title="Prayer Times"
        showBack
        rightContent={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        }
      />

      <div className="px-5 pb-8 space-y-5">
        {/* Location + Date */}
        {location && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>{location.city}{location.country ? `, ${location.country}` : ''}</span>
          </div>
        )}

        {/* Hijri Date */}
        {hijriDate && (
          <div className="text-center py-2">
            <p className="text-lg font-semibold text-foreground">
              {hijriDate.fullDate} {hijriDate.designation}
            </p>
            {gregorianDate && (
              <p className="text-xs text-muted-foreground mt-0.5">{gregorianDate}</p>
            )}
          </div>
        )}

        {/* Next Prayer Highlight */}
        {nextPrayer && times && (
          <Card className="overflow-hidden border-primary/15">
            <CardContent className="p-0">
              <div className="relative px-5 py-5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-primary/3" />
                <div className="relative text-center">
                  <p className="text-xs text-muted-foreground mb-1">Next Prayer</p>
                  <p className="text-2xl font-bold text-foreground">{PRAYER_LABELS[nextPrayer]}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{times[nextPrayer]}</p>
                  {countdown && (
                    <p className="text-lg font-semibold text-primary mt-2 tabular-nums font-mono">
                      {countdown}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Prayer Times */}
        {loading && !times && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        )}

        {error && !times && (
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={refresh}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {times && (
          <Card>
            <CardContent className="p-0 divide-y divide-border/40">
              {Object.entries(times).map(([prayer, time]) => {
                const Icon = PRAYER_ICONS[prayer] || Clock;
                const isNext = prayer === nextPrayer;
                return (
                  <div
                    key={prayer}
                    className={cn(
                      'flex items-center justify-between px-4 py-3.5 transition-colors',
                      isNext && 'bg-primary/5',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                          isNext ? 'bg-primary/15 text-primary' : 'bg-secondary/60 text-muted-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={cn('text-sm', isNext ? 'font-semibold text-foreground' : 'text-foreground')}>
                        {PRAYER_LABELS[prayer] || prayer}
                      </span>
                    </div>
                    <span className={cn(
                      'text-sm tabular-nums',
                      isNext ? 'font-semibold text-primary' : 'text-muted-foreground',
                    )}>
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
