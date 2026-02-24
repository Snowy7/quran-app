import { useState, useEffect } from 'react';
import { usePrayerTimes } from '@/lib/hooks/use-prayer-times';
import { useTranslation } from '@/lib/i18n';

const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
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
  const period = hours >= 12 ? 'PM' : 'AM';
  const periodAr = hours >= 12 ? 'م' : 'ص';
  const hours12 = hours % 12 || 12;
  return {
    time: `${hours12}:${minutes.toString().padStart(2, '0')}`,
    period: periodAr,
  };
}

export function PrayerHero() {
  const { nextPrayer, times, countdown, loading } = usePrayerTimes();
  const { t, language } = useTranslation();
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

  const prayerNameAr = nextPrayer ? PRAYER_NAMES_AR[nextPrayer] || nextPrayer : 'الظهر';
  const prayerNameEn = nextPrayer ? PRAYER_NAMES_EN[nextPrayer] || nextPrayer : 'Dhuhr';
  const nextPrayerTime = nextPrayer && times ? formatTime12h(times[nextPrayer as keyof typeof times] || '12:00') : null;

  return (
    <div className="relative rounded-2xl overflow-hidden h-[160px] md:h-[200px] animate-fade-in">
      {/* Background */}
      <div className="absolute inset-0 bg-secondary" />

      {/* Background image */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none">
        <img
          src="/images/hero.png"
          alt=""
          className="absolute right-0 top-1/2 -translate-y-1/2 h-[180%] w-auto opacity-20"
          style={{
            filter: 'brightness(0.6) sepia(0.3)',
            maskImage: 'linear-gradient(to left, black 20%, transparent 90%)',
            WebkitMaskImage: 'linear-gradient(to left, black 20%, transparent 90%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-5 md:px-7 text-primary">
        {/* Prayer name */}
        <p className="font-arabic-ui text-sm md:text-lg mb-1" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {language === 'ar' ? prayerNameAr : prayerNameEn}
        </p>

        {/* Time display */}
        <div className="flex items-end gap-1.5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {nextPrayerTime && (
            <span className="font-arabic-ui text-xs md:text-sm mb-1.5">{nextPrayerTime.period}</span>
          )}
          <span className="font-['Poppins',sans-serif] text-4xl md:text-6xl font-semibold tracking-tight">
            {currentTime}
          </span>
        </div>

        {/* Next prayer info */}
        <div className="mt-2.5 flex items-center gap-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <p className="font-arabic-ui text-xs md:text-sm opacity-90">
              {language === 'ar'
                ? `الصلاة التالية: ${nextPrayer ? PRAYER_NAMES_AR[nextPrayer] : '--'}`
                : `Next: ${nextPrayer ? PRAYER_NAMES_EN[nextPrayer] : '--'}`}
            </p>
          </div>
          {countdown && (
            <span className="font-['Poppins',sans-serif] font-bold text-sm md:text-base">
              {countdown}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
