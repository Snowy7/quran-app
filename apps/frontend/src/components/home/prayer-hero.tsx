import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { usePrayerTimes } from '@/lib/hooks/use-prayer-times';

function formatCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function PrayerHero() {
  const { nextPrayer, countdown, location, hijriDate, loading } = usePrayerTimes();
  const [currentTime, setCurrentTime] = useState(formatCurrentTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatCurrentTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const prayerNames: Record<string, string> = {
    Fajr: 'Fajr',
    Sunrise: 'Sunrise',
    Dhuhr: 'Dhuhr',
    Asr: 'Asr',
    Maghrib: 'Maghrib',
    Isha: 'Isha',
  };

  return (
    <div className="relative -mx-5 h-[350px] overflow-hidden">
      {/* Sun/atmospheric gradient */}
      <div className="absolute inset-0">
        {/* Main circular sun gradient */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-[0px] w-[120%] h-[450px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 60%, rgb(253 224 71 / 0.7) 0%, rgb(251 191 36 / 0.5) 20%, rgb(245 158 11 / 0.35) 40%, rgb(217 119 6 / 0.15) 60%, transparent 75%)',
          }}
        />
        {/* Secondary warm glow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-[100px] w-[400px] h-[450px] rounded-full blur-2xl"
          style={{
            background: 'radial-gradient(circle, rgb(254 243 199 / 0.6) 0%, rgb(253 230 138 / 0.25) 40%, transparent 70%)',
          }}
        />
      </div>

      {/* Mosque silhouette - positioned at bottom, fades out */}
      <div className="absolute -bottom-12 left-0 right-0 h-[120px] pointer-events-none">
        <img
          src="/images/hero.png"
          alt=""
          className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[100%] max-w-none h-auto opacity-25"
          style={{
            filter: 'brightness(0.1)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
          }}
        />
      </div>

      {/* Bottom fade to background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[100px] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 10%, hsl(var(--background)) 80%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between py-20">
        {/* Current time */}
        <div className="text-center mb-3">
          <div className="text-7xl font-bold tracking-tight text-amber-950 dark:text-amber-50">
            {currentTime}
          </div>
        </div>

        {/* Info row */}
        <div className="flex justify-center items-start gap-4 text-center px-4">
          {/* Remaining time */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-amber-800/70 dark:text-amber-200/70 mb-0.5 font-medium">
              Remaining Time
            </p>
            {loading ? (
              <div className="h-5 w-20 mx-auto bg-amber-900/10 rounded animate-pulse" />
            ) : (
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100 truncate">
                {nextPrayer ? `${prayerNames[nextPrayer]} ${countdown}` : '--:--:--'}
              </p>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-9 bg-amber-800/20 dark:bg-amber-200/20 flex-shrink-0" />

          {/* Date & Location */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-amber-800/70 dark:text-amber-200/70 mb-0.5 font-medium truncate">
              {hijriDate ? hijriDate.fullDate : 'Islamic Date'}
            </p>
            {loading ? (
              <div className="h-5 w-24 mx-auto bg-amber-900/10 rounded animate-pulse" />
            ) : location?.city ? (
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100 flex items-center gap-1 justify-center">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{location.city}</span>
              </p>
            ) : (
              <p className="text-sm text-amber-800/60 dark:text-amber-200/60">Enable location</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
