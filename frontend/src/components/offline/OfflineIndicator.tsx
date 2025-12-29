'use client';

import { useOfflineSync } from '@/src/hooks/useOfflineSync';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Cloud, 
  CloudOff, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export function OfflineIndicator({ showDetails = true, className }: OfflineIndicatorProps) {
  const { 
    isOnline, 
    syncStatus, 
    pendingChanges, 
    syncNow 
  } = useOfflineSync();

  const statusColor = isOnline 
    ? pendingChanges > 0 
      ? 'text-yellow-500' 
      : 'text-green-500'
    : 'text-red-500';

  const StatusIcon = isOnline 
    ? pendingChanges > 0 
      ? Cloud 
      : CheckCircle
    : CloudOff;

  if (!showDetails) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <StatusIcon className={cn('w-4 h-4', statusColor)} />
        {!isOnline && (
          <span className="text-sm text-muted-foreground">Offline</span>
        )}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn('flex items-center gap-2', className)}
        >
          <StatusIcon className={cn('w-4 h-4', statusColor)} />
          {!isOnline ? (
            <span className="text-sm">Offline</span>
          ) : pendingChanges > 0 ? (
            <Badge variant="secondary" className="text-xs">
              {pendingChanges} pending
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <div>
              <div className="font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <div className="text-sm text-muted-foreground">
                {isOnline 
                  ? 'All changes are synced' 
                  : 'Changes will sync when reconnected'
                }
              </div>
            </div>
          </div>

          {pendingChanges > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">
                  {pendingChanges} pending change{pendingChanges > 1 ? 's' : ''}
                </span>
              </div>
              {isOnline && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={syncNow}
                  disabled={syncStatus.is_syncing}
                >
                  <RefreshCw className={cn(
                    'w-4 h-4 mr-1',
                    syncStatus.is_syncing && 'animate-spin'
                  )} />
                  Sync
                </Button>
              )}
            </div>
          )}

          {syncStatus.last_sync && (
            <div className="text-xs text-muted-foreground">
              Last synced: {new Date(syncStatus.last_sync).toLocaleString()}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
