import { useState, useEffect } from 'react';
import { usePrayerTimes } from '@/lib/hooks/use-prayer-times';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: '\u0627\u0644\u0641\u062C\u0631',
  Sunrise: '\u0627\u0644\u0634\u0631\u0648\u0642',
  Dhuhr: '\u0627\u0644\u0638\u0647\u0631',
  Asr: '\u0627\u0644\u0639\u0635\u0631',
  Maghrib: '\u0627\u0644\u0645\u063A\u0631\u0628',
  Isha: '\u0627\u0644\u0639\u0634\u0627\u0621',
};

const PRAYER_NAMES_EN: Record<string, string> = {
  Fajr: 'Fajr',
  Sunrise: 'Sunrise',
  Dhuhr: 'Dhuhr',
  Asr: 'Asr',
  Maghrib: 'Maghrib',
  Isha: 'Isha',
};

function formatTime12h(time24: string): { time: string; period: string } {
  const [hours, minutes] = time24.split(':').map(Number);
  const periodAr = hours >= 12 ? '\u0645' : '\u0635';
  const hours12 = hours % 12 || 12;
  return {
    time: `${hours12}:${minutes.toString().padStart(2, '0')}`,
    period: periodAr,
  };
}

export function PrayerHero() {
  const { nextPrayer, times, countdown } = usePrayerTimes();
  const { isRTL } = useTranslation();
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const prayerNameAr = nextPrayer ? PRAYER_NAMES_AR[nextPrayer] || nextPrayer : '\u0627\u0644\u0638\u0647\u0631';
  const prayerNameEn = nextPrayer ? PRAYER_NAMES_EN[nextPrayer] || nextPrayer : 'Dhuhr';
  const nextPrayerTime = nextPrayer && times ? formatTime12h(times[nextPrayer as keyof typeof times] || '12:00') : null;

  return (
    <div className="relative rounded-2xl overflow-hidden animate-fade-in">
      {/* Clean gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/85" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />

      {/* Mosque silhouette */}
      <div className="absolute right-0 bottom-0 w-2/5 h-full pointer-events-none">
        <img
          src="/images/hero.png"
          alt=""
          className="absolute right-0 bottom-0 h-[140%] w-auto opacity-10"
          style={{
            maskImage: 'linear-gradient(to left, black 10%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(to left, black 10%, transparent 80%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 px-5 py-5 md:px-7 md:py-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <p className="font-arabic-ui text-primary-foreground/60 text-xs md:text-sm mb-1">
          {isRTL ? '\u0627\u0644\u0635\u0644\u0627\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629' : 'Next Prayer'}
        </p>
        <p className={cn(
          'text-primary-foreground font-semibold text-lg md:text-xl mb-3',
          isRTL ? 'font-arabic-ui' : "font-['Poppins',sans-serif]"
        )}>
          {isRTL ? prayerNameAr : prayerNameEn}
        </p>

        {/* Time display */}
        <div className="flex items-baseline gap-2">
          <span className="font-['Poppins',sans-serif] text-primary-foreground text-4xl md:text-5xl font-light tracking-tight tabular-nums">
            {currentTime}
          </span>
          {nextPrayerTime && (
            <span className="font-arabic-ui text-primary-foreground/40 text-xs">{nextPrayerTime.period}</span>
          )}
        </div>

        {/* Countdown pill */}
        {countdown && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
            <span className="font-['Poppins',sans-serif] text-primary-foreground/90 text-xs font-medium tabular-nums">
              {countdown}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
