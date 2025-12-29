'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DashboardWidget as DashboardWidgetType, WidgetData } from '@/types';
import { 
  GripVertical, 
  MoreVertical, 
  Settings, 
  RefreshCw, 
  Trash2, 
  Maximize2,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardWidgetProps {
  widget: DashboardWidgetType;
  data?: WidgetData;
  isEditing?: boolean;
  isLoading?: boolean;
  onRefresh?: (widgetId: string) => void;
  onSettings?: (widgetId: string) => void;
  onDelete?: (widgetId: string) => void;
  onDuplicate?: (widgetId: string) => void;
  onMaximize?: (widgetId: string) => void;
  children?: React.ReactNode;
}

export function DashboardWidget({
  widget,
  data,
  isEditing = false,
  isLoading = false,
  onRefresh,
  onSettings,
  onDelete,
  onDuplicate,
  onMaximize,
  children,
}: DashboardWidgetProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.(widget.id);
    } finally {
      setIsRefreshing(false);
    }
  }, [widget.id, onRefresh]);

  return (
    <Card 
      className={cn(
        'h-full overflow-hidden transition-shadow',
        isEditing && 'ring-2 ring-primary/20 cursor-move',
        widget.show_border === false && 'border-transparent shadow-none'
      )}
      style={{
        backgroundColor: widget.background_color,
        color: widget.text_color,
      }}
    >
      {widget.show_header !== false && (
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {isEditing && (
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            )}
            <div>
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              {widget.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{widget.subtitle}</p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRefresh}>
                <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
                Refresh
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMaximize?.(widget.id)}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Expand
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSettings?.(widget.id)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(widget.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(widget.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
      )}
      <CardContent className={cn(
        'p-4',
        widget.show_header === false && 'pt-4'
      )}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
