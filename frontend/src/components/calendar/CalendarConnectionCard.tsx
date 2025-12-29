'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarConnection } from '@/types';
import { Calendar, RefreshCw, Settings, Trash2, MoreVertical, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarConnectionCardProps {
  connection: CalendarConnection;
  onSync?: (id: string) => void;
  onToggle?: (id: string, enabled: boolean) => void;
  onDelete?: (id: string) => void;
  onSettings?: (id: string) => void;
}

const providerIcons: Record<string, React.ReactNode> = {
  google: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  outlook: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M24 7.387v10.478c0 .23-.08.424-.238.576-.159.152-.352.228-.579.228h-8.136V6.583h8.136c.227 0 .42.076.58.228.157.152.237.345.237.576z" fill="#0072C6"/>
      <path d="M15.047 6.583v12.086l-6.141 3.521L0 18.668V5.079l8.906-5.08 6.141 3.52v3.064z" fill="#0072C6"/>
      <path d="M8.906 8.428c-1.088 0-2.008.415-2.76 1.245-.752.83-1.128 1.887-1.128 3.17 0 1.23.368 2.26 1.105 3.09.736.83 1.648 1.244 2.736 1.244 1.1 0 2.024-.41 2.77-1.233.748-.822 1.121-1.872 1.121-3.148 0-1.264-.369-2.308-1.109-3.132-.74-.824-1.66-1.236-2.735-1.236zm-.024 6.708c-.576 0-1.036-.254-1.38-.762-.343-.508-.515-1.163-.515-1.965 0-.85.168-1.525.504-2.026.336-.5.796-.751 1.38-.751.592 0 1.06.254 1.404.763.344.508.516 1.175.516 2.002 0 .838-.172 1.501-.516 1.99-.344.488-.808.732-1.393.749z" fill="#fff"/>
    </svg>
  ),
  apple: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  ),
  caldav: <Calendar className="w-5 h-5" />,
};

const syncStatusIcon: Record<string, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  partial: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  failed: <AlertCircle className="w-4 h-4 text-red-500" />,
};

export function CalendarConnectionCard({
  connection,
  onSync,
  onToggle,
  onDelete,
  onSettings,
}: CalendarConnectionCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync?.(connection.id);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className={cn(!connection.is_active && 'opacity-60')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              {providerIcons[connection.provider]}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {connection.name}
                {connection.is_primary && (
                  <Badge variant="secondary" className="text-xs">Primary</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {connection.provider_display || connection.provider}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSettings?.(connection.id)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(connection.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Sync enabled</span>
          <Switch
            checked={connection.sync_enabled}
            onCheckedChange={(checked: boolean) => onToggle?.(connection.id, checked)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Switch checked={connection.sync_tasks} disabled className="scale-75" />
            <span className="text-muted-foreground">Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={connection.sync_milestones} disabled className="scale-75" />
            <span className="text-muted-foreground">Milestones</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={connection.sync_deadlines} disabled className="scale-75" />
            <span className="text-muted-foreground">Deadlines</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {connection.last_sync_status && syncStatusIcon[connection.last_sync_status]}
            {connection.last_sync_at ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last synced {new Date(connection.last_sync_at).toLocaleDateString()}
              </span>
            ) : (
              <span>Never synced</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || !connection.sync_enabled}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isSyncing && 'animate-spin')} />
            Sync Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
