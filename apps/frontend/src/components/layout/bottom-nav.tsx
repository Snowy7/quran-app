import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom Quran icon component that switches between outline and filled
function QuranIcon({ active, className }: { active?: boolean; className?: string }) {
  return (
    <img
      src={active ? '/images/quran_filled.png' : '/images/quran.png'}
      alt="Quran"
      className={cn(
        'w-6 h-6 object-contain',
        className
      )}
    />
  );
}

interface NavItem {
  to: string;
  icon: React.ElementType | 'quran';
}

const navItems: NavItem[] = [
  { to: '/', icon: Home },
  { to: '/quran', icon: 'quran' },
  { to: '/qibla', icon: Compass },
  { to: '/memorize', icon: GraduationCap },
];

export function BottomNav() {
  const location = useLocation();

  // Hide bottom nav on reader page (full-screen reading)
  if (location.pathname.startsWith('/quran/') && location.pathname.split('/').length > 2) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none safe-area-bottom">
      <nav className="pointer-events-auto bg-card/95 backdrop-blur-xl border border-border/50 rounded-full shadow-xl shadow-black/15 px-2 py-2">
        <div className="flex items-center gap-1">
          {navItems.map(({ to, icon: Icon }) => {
            const isActive = location.pathname === to ||
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
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                {Icon === 'quran' ? (
                  <QuranIcon active={isActive} />
                ) : (
                  <Icon
                    className="w-5 h-5"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
