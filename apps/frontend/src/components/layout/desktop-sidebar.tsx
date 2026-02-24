import { NavLink, Link, useLocation } from 'react-router-dom';
import { Home, Compass, GraduationCap, Clock, BookMarked, Settings, Search, BookOpen } from 'lucide-react';
import { useAuth, useUser, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Logo } from '@/components/brand/logo';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function QuranIcon({ active, className }: { active?: boolean; className?: string }) {
  return (
    <img
      src={active ? '/images/quran_filled.png' : '/images/quran.png'}
      alt="Quran"
      className={cn(
        'w-5 h-5 object-contain',
        active ? 'brightness-0 invert' : 'dark:brightness-0 dark:invert',
        className
      )}
    />
  );
}

type TranslationKey = 'home' | 'quran' | 'qibla' | 'memorize' | 'search' | 'prayerTimes' | 'bookmarks' | 'settings';

const mainNav: { to: string; icon: typeof Home | 'quran'; tKey: TranslationKey }[] = [
  { to: '/', icon: Home, tKey: 'home' },
  { to: '/quran', icon: 'quran' as const, tKey: 'quran' },
  { to: '/qibla', icon: Compass, tKey: 'qibla' },
  { to: '/memorize', icon: GraduationCap, tKey: 'memorize' },
  { to: '/search', icon: Search, tKey: 'search' },
];

const secondaryNav: { to: string; icon: typeof Home; tKey: TranslationKey }[] = [
  { to: '/prayer-times', icon: Clock, tKey: 'prayerTimes' },
  { to: '/bookmarks', icon: BookMarked, tKey: 'bookmarks' },
  { to: '/settings', icon: Settings, tKey: 'settings' },
];

export function DesktopSidebar() {
  const location = useLocation();
  const { user } = useUser();
  const { t } = useTranslation();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-border bg-background shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <Logo size="sm" />
        <span className="font-bold text-lg text-primary font-arabic-ui">نور</span>
        <span className="text-sm text-muted-foreground">Noor</span>
      </div>

      {/* User section */}
      <div className="px-4 py-4 border-b border-border">
        <SignedIn>
          <div className="flex items-center gap-3">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {user?.firstName?.[0] || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.fullName || user?.firstName || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </SignedIn>
        <SignedOut>
          <Link
            to="/sign-in"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Sign In</p>
              <p className="text-xs text-muted-foreground">Sync across devices</p>
            </div>
          </Link>
        </SignedOut>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          {t('navigation')}
        </p>
        {mainNav.map(({ to, icon: Icon, tKey }) => {
          const isActive = location.pathname === to ||
            (to !== '/' && location.pathname.startsWith(to));

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
              )}
            >
              {Icon === 'quran' ? (
                <QuranIcon active={isActive} className={isActive ? 'brightness-0 invert' : ''} />
              ) : (
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              )}
              <span className="text-sm font-medium">{t(tKey)}</span>
            </NavLink>
          );
        })}

        <div className="my-4 border-t border-border" />

        <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          {t('more')}
        </p>
        {secondaryNav.map(({ to, icon: Icon, tKey }) => {
          const isActive = location.pathname === to;

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-sm font-medium">{t(tKey)}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Version footer */}
      <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground text-center">
        Noor v1.0.0
      </div>
    </aside>
  );
}
