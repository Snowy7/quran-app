import { Link } from 'react-router-dom';
import { BookMarked, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  to: string;
  icon: React.ElementType;
  label: string;
  bgColor: string;
  iconColor: string;
}

const actions: QuickAction[] = [
  {
    to: '/bookmarks',
    icon: BookMarked,
    label: 'Bookmarks',
    bgColor: 'bg-rose-500/10',
    iconColor: 'text-rose-600 dark:text-rose-500',
  },
  {
    to: '/prayer-times',
    icon: Clock,
    label: 'Prayer Times',
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-500',
  },
];

export function QuickActions() {
  return (
    <div className="flex gap-3">
      {actions.map(({ to, icon: Icon, label, bgColor, iconColor }, index) => (
        <Link
          key={to}
          to={to}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border flex-1',
            'transition-all duration-200 ease-out',
            'hover:shadow-md hover:-translate-y-0.5 hover:border-border/60',
            'active:scale-[0.98] active:shadow-sm'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200',
              bgColor
            )}
          >
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
          <span className="text-sm font-medium">{label}</span>
        </Link>
      ))}
    </div>
  );
}
