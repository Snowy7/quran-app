import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, useUser, SignedIn, SignedOut } from '@clerk/clerk-react';
import {
  X, Clock, BookMarked, Settings, HelpCircle, LogIn, LogOut, User
} from 'lucide-react';
import { Button } from '@template/ui';
import { Logo } from '@/components/brand/logo';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type TranslationKey = 'prayerTimes' | 'bookmarks' | 'settings';

const menuItems: { to: string; icon: typeof Clock; tKey: TranslationKey }[] = [
  { to: '/prayer-times', icon: Clock, tKey: 'prayerTimes' },
  { to: '/bookmarks', icon: BookMarked, tKey: 'bookmarks' },
  { to: '/settings', icon: Settings, tKey: 'settings' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { t, language, isRTL } = useTranslation();
  const prevPathRef = useRef(location.pathname);

  // Close on route change (but not on mount)
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      onClose();
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className={cn(
          'fixed inset-y-0 z-[70] w-72 bg-background',
          'transform transition-transform duration-300 ease-in-out',
          isRTL
            ? 'right-0 border-l border-border'
            : 'left-0 border-r border-border',
          isRTL
            ? (isOpen ? 'translate-x-0' : 'translate-x-full')
            : (isOpen ? 'translate-x-0' : '-translate-x-full')
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <span className="font-semibold font-arabic-ui">{t('noor')}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User Section */}
          <div className="p-4 border-b border-border">
            <SignedIn>
              <div className="flex items-center gap-3">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
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
                className="flex items-center gap-3 p-3 -m-3 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t('signIn')}</p>
                  <p className="text-xs text-muted-foreground">{t('syncDevices')}</p>
                </div>
              </Link>
            </SignedOut>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map(({ to, icon: Icon, tKey }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-secondary'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{t(tKey)}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-1">
            <Link
              to="/help"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">{t('helpSupport')}</span>
            </Link>
            <SignedIn>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{t('signOut')}</span>
              </button>
            </SignedIn>
          </div>

          {/* Version */}
          <div className="px-4 py-3 text-center text-xs text-muted-foreground">
            {t('noor')} v1.0.0
          </div>
        </div>
      </div>
    </>
  );
}

// Hook for sidebar state
export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
