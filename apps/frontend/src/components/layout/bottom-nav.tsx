import { NavLink, useLocation } from 'react-router-dom';
import { Home, Book, BookMarked, GraduationCap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/quran', icon: Book, label: 'Quran' },
  { to: '/bookmarks', icon: BookMarked, label: 'Bookmarks' },
  { to: '/memorize', icon: GraduationCap, label: 'Hifz' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();

  // Hide bottom nav on reader page (full-screen reading)
  if (location.pathname.startsWith('/quran/') && location.pathname.split('/').length > 2) {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to ||
            (to !== '/' && location.pathname.startsWith(to));

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center',
                'w-16 h-14 rounded-xl',
                'transition-all duration-200',
                'touch-manipulation',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 mb-1',
                  'transition-transform duration-200',
                  isActive && 'scale-110'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                'text-[10px] font-medium',
                isActive && 'font-semibold'
              )}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
