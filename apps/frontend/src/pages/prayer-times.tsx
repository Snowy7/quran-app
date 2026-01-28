import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, RefreshCw, Check, ChevronLeft, ChevronRight, Calendar, AlertCircle, Clock } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@template/ui';
import { usePrayerTimes, usePrayerTracking } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import type { PrayerName, PrayerLog } from '@/types/quran';

// Prayer icons as inline SVGs
const PrayerIcons = {
  Fajr: () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
      <path d="M4 24h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 20a7 7 0 0 1 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M16 20a7 7 0 0 0-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <circle cx="16" cy="20" r="4" fill="currentColor" opacity="0.4" />
    </svg>
  ),
  Dhuhr: () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
      <circle cx="16" cy="16" r="5" fill="currentColor" />
      <path d="M16 4v4M16 24v4M4 16h4M24 16h4M7.76 7.76l2.83 2.83M21.41 21.41l2.83 2.83M7.76 24.24l2.83-2.83M21.41 10.59l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Asr: () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
      <circle cx="16" cy="14" r="4.5" fill="currentColor" opacity="0.8" />
      <path d="M16 5v2M9.17 8.17l1.41 1.41M6 15h2M26 15h-2M22.83 8.17l-1.41 1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 26h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  Maghrib: () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
      <path d="M4 22h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 22a6 6 0 0 0-12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="22" r="4" fill="currentColor" opacity="0.6" />
      <path d="M16 26v2M12 25l-1 2M20 25l1 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  Isha: () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
      <path d="M16 6a9 9 0 0 0 0 18c2 0 3.86-.6 5.4-1.6A9 9 0 0 1 16 6z" fill="currentColor" />
      <circle cx="26" cy="8" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="8" cy="12" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="24" cy="18" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  ),
};

const prayerDetails: { key: PrayerName; name: string; arabicName: string }[] = [
  { key: 'Fajr', name: 'Fajr', arabicName: 'الفجر' },
  { key: 'Dhuhr', name: 'Dhuhr', arabicName: 'الظهر' },
  { key: 'Asr', name: 'Asr', arabicName: 'العصر' },
  { key: 'Maghrib', name: 'Maghrib', arabicName: 'المغرب' },
  { key: 'Isha', name: 'Isha', arabicName: 'العشاء' },
];

type ViewMode = 'today' | 'calendar';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Helper to parse time string to today's Date
function parseTimeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
}

// Prayer order for determining if a prayer is late
const prayerOrderForLate: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

interface LatePrayerDialogState {
  isOpen: boolean;
  prayer: PrayerName | null;
  prayerTime: string | null;
}

export default function PrayerTimesPage() {
  const { times, nextPrayer, countdown, loading, error, location, refresh } = usePrayerTimes();
  const { todayPrayers, todayCompletedCount, togglePrayer, getLogsForMonth, getStats } = usePrayerTracking();

  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [monthLogs, setMonthLogs] = useState<PrayerLog[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getStats>> | null>(null);
  const [latePrayerDialog, setLatePrayerDialog] = useState<LatePrayerDialogState>({
    isOpen: false,
    prayer: null,
    prayerTime: null,
  });

  // Check if a prayer is considered "late" (its time has passed and we're past the next prayer's time)
  const isPrayerLate = useCallback((prayer: PrayerName): boolean => {
    if (!times) return false;

    const now = new Date();
    const prayerTime = parseTimeToDate(times[prayer]);

    // If prayer time hasn't arrived yet, it's not late
    if (prayerTime > now) return false;

    // Find the next prayer in order
    const currentIndex = prayerOrderForLate.indexOf(prayer);
    if (currentIndex === -1) return false;

    // If it's Isha, it's late if current time is past midnight or before Fajr
    if (prayer === 'Isha') {
      const fajrTime = parseTimeToDate(times.Fajr);
      // If we're past midnight and before Fajr, Isha is still "on time"
      if (now < fajrTime && now.getHours() < 6) return false;
      return true;
    }

    // For other prayers, check if the next prayer's time has arrived
    const nextIndex = currentIndex + 1;
    if (nextIndex < prayerOrderForLate.length) {
      const nextPrayerName = prayerOrderForLate[nextIndex];
      const nextPrayerTime = parseTimeToDate(times[nextPrayerName]);
      return now >= nextPrayerTime;
    }

    return false;
  }, [times]);

  // Check if a prayer time hasn't arrived yet
  const isPrayerFuture = useCallback((prayer: PrayerName): boolean => {
    if (!times) return false;
    const now = new Date();
    const prayerTime = parseTimeToDate(times[prayer]);
    return prayerTime > now;
  }, [times]);

  // Handle prayer click with late prayer confirmation
  const handlePrayerClick = useCallback((prayer: PrayerName) => {
    const isCompleted = todayPrayers[prayer]?.completed || false;

    // If unchecking, just toggle without dialog
    if (isCompleted) {
      togglePrayer(prayer);
      return;
    }

    // If the prayer is late, show confirmation dialog
    if (isPrayerLate(prayer) && times) {
      setLatePrayerDialog({
        isOpen: true,
        prayer,
        prayerTime: times[prayer],
      });
      return;
    }

    // Otherwise, just toggle normally (including future prayers)
    togglePrayer(prayer);
  }, [todayPrayers, togglePrayer, isPrayerLate, times]);

  // Confirm late prayer
  const handleConfirmLatePrayer = useCallback((prayedOnTime: boolean) => {
    if (latePrayerDialog.prayer) {
      // Toggle the prayer (mark as completed)
      togglePrayer(latePrayerDialog.prayer);
      // Note: In a real app, you might want to store whether it was prayed on time or late
      // For now, we just mark it as completed
    }
    setLatePrayerDialog({ isOpen: false, prayer: null, prayerTime: null });
  }, [latePrayerDialog.prayer, togglePrayer]);

  // Cancel late prayer dialog
  const handleCancelLatePrayer = useCallback(() => {
    setLatePrayerDialog({ isOpen: false, prayer: null, prayerTime: null });
  }, []);

  // Load calendar data when month changes
  useEffect(() => {
    if (viewMode === 'calendar') {
      getLogsForMonth(currentMonth.getFullYear(), currentMonth.getMonth())
        .then(setMonthLogs);
      getStats(30).then(setStats);
    }
  }, [viewMode, currentMonth, getLogsForMonth, getStats]);

  const prevMonth = () => {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getLogForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthLogs.find(l => l.id === dateStr);
  };

  const getCompletionForDay = (day: number) => {
    const log = getLogForDay(day);
    if (!log) return 0;
    return Object.values(log.prayers).filter(p => p.completed).length;
  };

  const today = new Date();
  const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();

  return (
    <div className="page-container">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-semibold">Prayer Times</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'today' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('today')}
              className="h-8"
            >
              Today
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="h-8"
            >
              <Calendar className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'today' ? (
        <>
          {/* Location */}
          {location && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{location.city}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refresh()}
                disabled={loading}
                className="h-8 w-8"
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </Button>
            </div>
          )}

          {/* Error State */}
          {error && !times && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Location Required</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => refresh()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && !times && (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 animate-pulse">
                  <div className="w-14 h-14 bg-secondary rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-secondary rounded mb-2" />
                    <div className="h-3 w-16 bg-secondary rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Prayer Times List with Tracking */}
          {times && (
            <div className="p-4 space-y-3">
              {/* Today's Progress */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Progress</p>
                    <p className="text-2xl font-bold">{todayCompletedCount}/5</p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-3 h-3 rounded-full',
                          i <= todayCompletedCount ? 'bg-primary' : 'bg-border'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Next Prayer Highlight */}
              {nextPrayer && countdown && nextPrayer !== 'Sunrise' && (
                <div className="p-4 rounded-2xl bg-primary text-primary-foreground mb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">Next Prayer</p>
                      <p className="text-xl font-semibold">{nextPrayer}</p>
                      <p className="text-sm opacity-80">
                        {times[nextPrayer as keyof typeof times]} - in {countdown}
                      </p>
                    </div>
                    <div className="text-primary-foreground opacity-80">
                      {PrayerIcons[nextPrayer as PrayerName]?.()}
                    </div>
                  </div>
                </div>
              )}

              {/* All Prayers */}
              {prayerDetails.map(({ key, name, arabicName }) => {
                const Icon = PrayerIcons[key];
                const time = times[key as keyof typeof times];
                const isNext = nextPrayer === key;
                const isCompleted = todayPrayers[key]?.completed || false;
                const isFuture = isPrayerFuture(key);
                const isLate = isPrayerLate(key);

                return (
                  <button
                    key={key}
                    onClick={() => handlePrayerClick(key)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border transition-all w-full text-left',
                      isCompleted
                        ? 'border-primary/30 bg-primary/5'
                        : isNext
                          ? 'border-primary/20 bg-background'
                          : 'border-border bg-card hover:bg-secondary/50'
                    )}
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                      isCompleted
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/30'
                    )}>
                      {isCompleted && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>

                    {/* Icon */}
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                      isCompleted
                        ? 'bg-primary/10 text-primary'
                        : isNext
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary text-foreground'
                    )}>
                      <Icon />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'font-medium',
                          isCompleted && 'line-through opacity-60'
                        )}>
                          {name}
                        </p>
                        <span className="arabic-text text-sm text-muted-foreground">
                          {arabicName}
                        </span>
                        {isFuture && !isCompleted && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            Upcoming
                          </span>
                        )}
                        {isLate && !isCompleted && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">
                            Late
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isCompleted
                          ? 'Completed'
                          : isFuture
                            ? 'Tap to mark in advance'
                            : isNext
                              ? 'Coming up'
                              : isLate
                                ? 'Tap to mark as prayed'
                                : 'Tap to mark as prayed'}
                      </p>
                    </div>

                    <p className={cn(
                      'font-semibold tabular-nums',
                      isCompleted ? 'text-primary' : isNext ? 'text-primary' : ''
                    )}>
                      {time}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Calendar View */
        <div className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="font-semibold">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Stats Summary */}
          {stats && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-secondary/50 text-center">
                <p className="text-2xl font-bold text-primary">{stats.completionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 text-center">
                <p className="text-2xl font-bold">{stats.completedPrayers}</p>
                <p className="text-xs text-muted-foreground">Prayers</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 text-center">
                <p className="text-2xl font-bold">{stats.daysWithData}</p>
                <p className="text-xs text-muted-foreground">Days</p>
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-secondary/50">
              {DAYS.map((day) => (
                <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
              {getDaysInMonth().map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="p-2 aspect-square" />;
                }

                const completion = getCompletionForDay(day);
                const isToday = isCurrentMonth && day === today.getDate();
                const isPast = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                return (
                  <div
                    key={day}
                    className={cn(
                      'p-1 aspect-square flex flex-col items-center justify-center border-t border-l border-border',
                      isToday && 'bg-primary/10'
                    )}
                  >
                    <span className={cn(
                      'text-sm',
                      isToday && 'font-bold text-primary'
                    )}>
                      {day}
                    </span>
                    {(completion > 0 || isPast) && (
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              i <= completion
                                ? completion === 5
                                  ? 'bg-emerald-500'
                                  : 'bg-primary'
                                : isPast
                                  ? 'bg-destructive/30'
                                  : 'bg-border'
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Complete</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive/30" />
              <span>Missed</span>
            </div>
          </div>

          {/* Per-Prayer Stats */}
          {stats && (
            <div className="mt-6">
              <h3 className="font-medium mb-3">Prayer Breakdown (Last 30 Days)</h3>
              <div className="space-y-2">
                {prayerDetails.map(({ key, name }) => {
                  const prayerStats = stats.byPrayer[key];
                  const percentage = prayerStats.total > 0
                    ? Math.round((prayerStats.completed / prayerStats.total) * 100)
                    : 0;

                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-20 text-sm">{name}</span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      {viewMode === 'today' && (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          <p>Times calculated using ISNA method</p>
          <p>Tap a prayer to mark it as completed</p>
        </div>
      )}

      {/* Late Prayer Confirmation Dialog */}
      <Dialog open={latePrayerDialog.isOpen} onOpenChange={(open) => !open && handleCancelLatePrayer()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Mark {latePrayerDialog.prayer} as Prayed
            </DialogTitle>
            <DialogDescription>
              The time for {latePrayerDialog.prayer} ({latePrayerDialog.prayerTime}) has passed.
              Did you pray it on time?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => handleConfirmLatePrayer(true)}
                className="w-full justify-start gap-3"
                variant="outline"
              >
                <Clock className="w-4 h-4 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Yes, I prayed on time</p>
                  <p className="text-xs text-muted-foreground">I prayed before the next prayer time</p>
                </div>
              </Button>
              <Button
                onClick={() => handleConfirmLatePrayer(false)}
                className="w-full justify-start gap-3"
                variant="outline"
              >
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <div className="text-left">
                  <p className="font-medium">No, I prayed late (Qada)</p>
                  <p className="text-xs text-muted-foreground">I'm making up a missed prayer</p>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleCancelLatePrayer}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
