import { Link } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { Button } from '@template/ui';
import { useUIStore } from '@/lib/stores/ui-store';
import { useSidebarContext } from './app-layout';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  children?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export function AppHeader({
  title,
  subtitle,
  showSearch = true,
  children,
  rightContent,
  className,
  sticky = true,
}: AppHeaderProps) {
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);
  const sidebar = useSidebarContext();

  return (
    <header className={cn(
      sticky && 'sticky top-0 z-40',
      'bg-background/95 backdrop-blur-sm safe-area-top',
      className
    )}>
      <div className="flex items-center justify-between h-14 px-5 md:px-8">
        {/* Left section - search */}
        <div className="flex items-center gap-2 min-w-[48px]">
          {showSearch && (
            <Link to="/search">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-primary hover:bg-primary/10"
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Center section */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
          {title && (
            <h1 className="text-base font-bold font-arabic-ui text-primary truncate max-w-[200px]">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-primary/60 font-arabic-ui truncate max-w-[200px]">
              {subtitle}
            </p>
          )}
          {children}
        </div>

        {/* Right section - menu */}
        <div className="flex items-center gap-1 min-w-[48px] justify-end">
          {rightContent}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-primary hover:bg-primary/10 lg:hidden"
            onClick={sidebar.open}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
