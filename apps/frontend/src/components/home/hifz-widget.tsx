import { Link } from 'react-router-dom';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { useOfflineMemorization } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export function HifzWidget() {
  const { stats, memorizations } = useOfflineMemorization();

  const needsRevision = memorizations.filter((m) => m.status === 'needs_revision');
  const totalProgress = Math.round((stats.memorized / 114) * 100);

  return (
    <Link to="/memorize" className="block">
      <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
        <div className="flex items-center gap-4">
          {/* Progress Ring */}
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-16 h-16 -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="5"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${totalProgress * 1.76} 176`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold">{stats.memorized}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium">Hifz Progress</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {stats.memorized} of 114 surahs completed
            </p>

            {/* Stats Row */}
            <div className="flex gap-4 text-xs">
              <div>
                <span className="font-medium text-primary">{stats.memorized}</span>
                <span className="text-muted-foreground ml-1">Done</span>
              </div>
              <div>
                <span className="font-medium">{stats.learning}</span>
                <span className="text-muted-foreground ml-1">Learning</span>
              </div>
              {stats.needsRevision > 0 && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  <span className="font-medium text-amber-600 dark:text-amber-500">
                    {stats.needsRevision}
                  </span>
                  <span className="text-muted-foreground">Review</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Revision Alert */}
        {needsRevision.length > 0 && (
          <div className={cn(
            'mt-3 p-2 rounded-lg',
            'bg-amber-500/10 text-amber-700 dark:text-amber-400'
          )}>
            <p className="text-xs">
              <span className="font-medium">{needsRevision.length} surah{needsRevision.length > 1 ? 's' : ''}</span>
              {' '}due for revision
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
