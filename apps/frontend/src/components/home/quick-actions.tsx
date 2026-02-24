import { Link } from 'react-router-dom';
import { BookMarked, Clock, Compass, GraduationCap } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface QuickAction {
  to: string;
  icon: React.ElementType;
  tKey: 'bookmarks' | 'prayerTimes' | 'qibla' | 'memorize';
  bgColor: string;
  iconColor: string;
}

const actions: QuickAction[] = [
  {
    to: '/bookmarks',
    icon: BookMarked,
    tKey: 'bookmarks',
    bgColor: 'bg-rose-500/10',
    iconColor: 'text-rose-600 dark:text-rose-500',
  },
  {
    to: '/prayer-times',
    icon: Clock,
    tKey: 'prayerTimes',
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-500',
  },
  {
    to: '/qibla',
    icon: Compass,
    tKey: 'qibla',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-500',
  },
  {
    to: '/memorize',
    icon: GraduationCap,
    tKey: 'memorize',
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-600 dark:text-purple-500',
  },
];

export function QuickActions() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-4 gap-2 md:gap-3">
      {actions.map(({ to, icon: Icon, tKey, bgColor, iconColor }, index) => (
        <Link
          key={to}
          to={to}
          className={cn(
            'flex flex-col items-center gap-2 px-2 py-3 md:py-4 rounded-xl bg-card border border-border',
            'transition-all duration-200 ease-out',
            'hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20',
            'active:scale-[0.98] active:shadow-sm'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div
            className={cn(
              'w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-transform duration-200',
              bgColor
            )}
          >
            <Icon className={cn('w-5 h-5 md:w-6 md:h-6', iconColor)} />
          </div>
          <span className="text-[10px] md:text-xs font-medium text-center leading-tight">{t(tKey)}</span>
        </Link>
      ))}
    </div>
  );
}
