import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, MoreVertical } from 'lucide-react';
import { Button } from '@template/ui';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/ui-store';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showMenu?: boolean;
  transparent?: boolean;
  children?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  showSearch = true,
  showMenu = false,
  transparent = false,
  children,
  rightContent,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        'safe-area-top',
        transparent
          ? 'bg-transparent'
          : 'bg-background/95 backdrop-blur-lg border-b border-border'
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left section */}
        <div className="flex items-center gap-2 min-w-[48px]">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 -ml-2"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Go back</span>
            </Button>
          )}
        </div>

        {/* Center section */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
          {title && (
            <h1 className="text-base font-semibold truncate max-w-[200px]">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {subtitle}
            </p>
          )}
          {children}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 min-w-[48px] justify-end">
          {rightContent}
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}
          {showMenu && (
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
