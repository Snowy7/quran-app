import { NavLink, useLocation } from 'react-router-dom';
import { Home, Bookmark, Brain, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

function QuranIcon({ active, className }: { active?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('w-5 h-5', className)}
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 4c0-1.1.9-2 2-2h4a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V4z" />
      <path d="M22 4c0-1.1-.9-2-2-2h-4a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V4z" />
    </svg>
  );
}

interface NavItem {
  to: string;
  icon: React.ElementType | 'quran';
  label: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/quran', icon: 'quran', label: 'Quran' },
  { to: '/collections', icon: Bookmark, label: 'Saved' },
  { to: '/hifz', icon: Brain, label: 'Hifz' },
  { to: '/search', icon: Search, label: 'Search' },
];

export function BottomNav() {
  const location = useLocation();

  // Hide on reader and drill
  const hideOnPaths = ['/quran/', '/hifz/drill'];
  const shouldHide = hideOnPaths.some(
    (p) => location.pathname.startsWith(p) && location.pathname !== '/quran',
  );
  if (shouldHide) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom lg:hidden">
      <div className="bg-background/95 backdrop-blur-xl border-t border-border/40">
        <nav className="mx-auto max-w-3xl">
          <div className="flex items-center justify-around px-2 py-1.5">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive =
                location.pathname === to ||
                (to !== '/' && location.pathname.startsWith(to));

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5',
                    'min-w-[52px] py-1.5 rounded-xl',
                    'transition-colors duration-150',
                    'touch-manipulation active:scale-95',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground',
                  )}
                  aria-label={label}
                >
                  {Icon === 'quran' ? (
                    <QuranIcon active={isActive} className={isActive ? 'text-primary' : undefined} />
                  ) : (
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                  )}
                  <span className={cn(
                    'text-[10px] leading-tight',
                    isActive ? 'font-semibold' : 'font-medium',
                  )}>
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
