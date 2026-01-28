import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useConvexSync } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Button } from '@template/ui';

interface SyncStatusProps {
  className?: string;
  showLabel?: boolean;
}

export function SyncStatus({ className, showLabel = false }: SyncStatusProps) {
  const { status, lastSyncedAt, error, syncAll, isSignedIn } = useConvexSync();

  if (!isSignedIn) {
    return null;
  }

  const getIcon = () => {
    switch (status) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success':
        return <Check className="w-4 h-4 text-primary" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'offline':
        return <CloudOff className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Cloud className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return lastSyncedAt
          ? `Synced ${formatRelativeTime(lastSyncedAt)}`
          : 'Synced';
      case 'error':
        return error || 'Sync failed';
      case 'offline':
        return 'Offline';
      default:
        return 'Sync';
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('gap-2 h-8 px-2', className)}
      onClick={() => syncAll()}
      disabled={status === 'syncing' || status === 'offline'}
      title={getLabel()}
    >
      {getIcon()}
      {showLabel && (
        <span className="text-xs text-muted-foreground">{getLabel()}</span>
      )}
    </Button>
  );
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    return 'just now';
  } else if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
}
