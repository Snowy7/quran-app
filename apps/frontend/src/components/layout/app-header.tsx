import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@template/ui';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showSettings?: boolean;
  rightContent?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  showSettings = false,
  rightContent,
  className,
  sticky = true,
}: AppHeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        sticky && 'sticky top-0 z-40',
        'bg-background/95 backdrop-blur-sm safe-area-top',
        className,
      )}
    >
      <div className="flex items-center justify-between h-14 px-5 md:px-8">
        {/* Left section */}
        <div className="flex items-center gap-2 min-w-[48px]">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-foreground hover:bg-secondary"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Go back</span>
            </Button>
          )}
        </div>

        {/* Center section */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
          {title && (
            <h1 className="text-base font-bold text-foreground truncate max-w-[200px]">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 min-w-[48px] justify-end">
          {rightContent}
          {showSettings && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-foreground hover:bg-secondary"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
