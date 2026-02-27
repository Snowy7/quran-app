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

  // Hide bottom nav on reader pages and drill mode
  const hideOnPaths = ['/quran/', '/hifz/drill'];
  const shouldHide = hideOnPaths.some(
    (p) => location.pathname.startsWith(p) && location.pathname !== '/quran'
  );
  if (shouldHide) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none safe-area-bottom lg:hidden">
      <nav className="pointer-events-auto bg-card/95 backdrop-blur-xl border border-border/50 rounded-full shadow-xl shadow-black/15 px-2 py-2">
        <div className="flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive =
              location.pathname === to ||
              (to !== '/' && location.pathname.startsWith(to));

            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex items-center justify-center',
                  'w-12 h-12 rounded-full',
                  'transition-all duration-200 ease-out',
                  'touch-manipulation active:scale-90',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                )}
                aria-label={label}
              >
                {Icon === 'quran' ? (
                  <QuranIcon active={isActive} />
                ) : (
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
