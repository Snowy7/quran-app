import { Link } from 'react-router-dom';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { useOfflineMemorization } from '@/lib/hooks';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function HifzWidget() {
  const { stats, memorizations } = useOfflineMemorization();
  const { t } = useTranslation();

  const needsRevision = memorizations.filter((m) => m.status === 'needs_revision');
  const totalProgress = Math.round((stats.memorized / 114) * 100);

  return (
    <Link to="/memorize" className="block">
      <div className="p-4 md:p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors h-full">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <p className="font-medium md:text-lg">{t('memorization')}</p>
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-4 md:gap-5">
          {/* Progress Ring */}
          <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="5"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${totalProgress * 2.83} 283`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm md:text-lg font-semibold">{stats.memorized}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base text-muted-foreground mb-2 md:mb-3">
              {stats.memorized} / 114
            </p>

            {/* Stats Row */}
            <div className="flex gap-3 md:gap-4 text-xs md:text-sm">
              <div>
                <span className="font-medium text-primary">{stats.memorized}</span>
                <span className="text-muted-foreground ml-1">{t('done')}</span>
              </div>
              <div>
                <span className="font-medium">{stats.learning}</span>
                <span className="text-muted-foreground ml-1">Learning</span>
              </div>
              {stats.needsRevision > 0 && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-500" />
                  <span className="font-medium text-amber-600 dark:text-amber-500">
                    {stats.needsRevision}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Revision Alert */}
        {needsRevision.length > 0 && (
          <div className={cn(
            'mt-3 md:mt-4 p-2.5 rounded-lg',
            'bg-amber-500/10 text-amber-700 dark:text-amber-400'
          )}>
            <p className="text-xs md:text-sm">
              <span className="font-medium">{needsRevision.length} surah{needsRevision.length > 1 ? 's' : ''}</span>
              {' '}due for revision
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
