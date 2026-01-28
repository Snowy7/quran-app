import { Link } from 'react-router-dom';
import { Book, GraduationCap, Compass, BookMarked, Clock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  to: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}

const actions: QuickAction[] = [
  {
    to: '/quran',
    icon: Book,
    label: 'Quran',
    description: 'Read & Listen',
    color: 'bg-primary/10 text-primary',
  },
  {
    to: '/memorize',
    icon: GraduationCap,
    label: 'Memorize',
    description: 'Hifz Progress',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-500',
  },
  {
    to: '/qibla',
    icon: Compass,
    label: 'Qibla',
    description: 'Find Direction',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-500',
  },
  {
    to: '/bookmarks',
    icon: BookMarked,
    label: 'Bookmarks',
    description: 'Saved Verses',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-500',
  },
  {
    to: '/prayer-times',
    icon: Clock,
    label: 'Prayer',
    description: 'Daily Times',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500',
  },
  {
    to: '/settings',
    icon: Settings,
    label: 'Settings',
    description: 'Preferences',
    color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map(({ to, icon: Icon, label, description, color }) => (
        <Link
          key={to}
          to={to}
          className="group p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
        >
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-2', color)}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </Link>
      ))}
    </div>
  );
}
