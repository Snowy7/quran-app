import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { useOfflineMemorization } from '@/lib/hooks';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function HifzWidget() {
  const { stats, memorizations } = useOfflineMemorization();
  const { t, isRTL } = useTranslation();

  const needsRevision = memorizations.filter((m) => m.status === 'needs_revision');
  const totalProgress = Math.round((stats.memorized / 114) * 100);

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <Link to="/memorize" className="block">
      <div className="rounded-2xl bg-card border border-border/50 p-4 md:p-5 hover:border-primary/30 transition-colors h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className={cn('font-semibold', isRTL && 'font-arabic-ui')}>{t('memorization')}</p>
          <ChevronIcon className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Progress ring + stats */}
        <div className="flex items-center gap-5">
          <div className="relative w-[72px] h-[72px] md:w-[88px] md:h-[88px] shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="40%"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="5"
              />
              <circle
                cx="50%"
                cy="50%"
                r="40%"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${totalProgress * 2.51} 251`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base md:text-lg font-bold leading-none">{stats.memorized}</span>
              <span className="text-[9px] text-muted-foreground/60 mt-0.5">/114</span>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-2.5">
            <div className={cn('flex gap-4 text-xs', isRTL && 'font-arabic-ui')}>
              <div>
                <span className="font-bold text-primary">{stats.memorized}</span>
                <span className="text-muted-foreground ms-1">{t('done')}</span>
              </div>
              <div>
                <span className="font-bold">{stats.learning}</span>
                <span className="text-muted-foreground ms-1">{t('learning')}</span>
              </div>
            </div>

            {needsRevision.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className={cn('text-xs font-medium', isRTL && 'font-arabic-ui')}>
                  {needsRevision.length} {isRTL ? '\u0633\u0648\u0631 \u062A\u062D\u062A\u0627\u062C \u0645\u0631\u0627\u062C\u0639\u0629' : 'due for revision'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
