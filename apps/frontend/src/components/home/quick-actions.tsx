import { Link } from 'react-router-dom';
import { BookMarked, Clock, Compass, GraduationCap } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface QuickAction {
  to: string;
  icon: React.ElementType;
  tKey: 'bookmarks' | 'prayerTimes' | 'qibla' | 'memorize';
  bg: string;
  iconBg: string;
}

const actions: QuickAction[] = [
  {
    to: '/bookmarks',
    icon: BookMarked,
    tKey: 'bookmarks',
    bg: 'bg-rose-100/70 dark:bg-rose-900/20',
    iconBg: 'bg-rose-500 shadow-rose-500/25',
  },
  {
    to: '/prayer-times',
    icon: Clock,
    tKey: 'prayerTimes',
    bg: 'bg-emerald-100/70 dark:bg-emerald-900/20',
    iconBg: 'bg-emerald-500 shadow-emerald-500/25',
  },
  {
    to: '/qibla',
    icon: Compass,
    tKey: 'qibla',
    bg: 'bg-sky-100/70 dark:bg-sky-900/20',
    iconBg: 'bg-sky-500 shadow-sky-500/25',
  },
  {
    to: '/memorize',
    icon: GraduationCap,
    tKey: 'memorize',
    bg: 'bg-violet-100/70 dark:bg-violet-900/20',
    iconBg: 'bg-violet-500 shadow-violet-500/25',
  },
];

export function QuickActions() {
  const { t, isRTL } = useTranslation();

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {actions.map(({ to, icon: Icon, tKey, bg, iconBg }) => (
        <Link
          key={to}
          to={to}
          className={cn(
            'group flex flex-col items-center gap-2.5 py-4 md:py-5 rounded-2xl',
            bg,
            'transition-all duration-200 ease-out',
            'hover:shadow-md hover:-translate-y-0.5',
            'active:scale-[0.97] active:shadow-none'
          )}
        >
          <div
            className={cn(
              'w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center',
              'transition-transform duration-200 group-hover:scale-110',
              'shadow-md',
              iconBg
            )}
          >
            <Icon className="w-[18px] h-[18px] md:w-5 md:h-5 text-white" />
          </div>
          <span className={cn(
            'text-[10px] md:text-xs font-medium text-center leading-tight text-foreground/70',
            isRTL && 'font-arabic-ui'
          )}>
            {t(tKey)}
          </span>
        </Link>
      ))}
    </div>
  );
}
