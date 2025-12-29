'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dashboard, DashboardWidget as DashboardWidgetType, WidgetTemplate } from '@/types';
import { DashboardWidget } from './DashboardWidget';
import { WidgetPicker } from './WidgetPicker';
import { Plus, Settings, Share2, Save, Eye, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardBuilderProps {
  dashboard: Dashboard;
  widgets: DashboardWidgetType[];
  widgetTemplates?: WidgetTemplate[];
  isEditing?: boolean;
  onToggleEdit?: () => void;
  onAddWidget?: (template: WidgetTemplate) => void;
  onUpdateWidget?: (widgetId: string, updates: Partial<DashboardWidgetType>) => void;
  onDeleteWidget?: (widgetId: string) => void;
  onDuplicateWidget?: (widgetId: string) => void;
  onReorderWidgets?: (widgetIds: string[]) => void;
  onSave?: () => void;
  onSettings?: () => void;
  onShare?: () => void;
  renderWidgetContent?: (widget: DashboardWidgetType) => React.ReactNode;
}

export function DashboardBuilder({
  dashboard,
  widgets,
  widgetTemplates = [],
  isEditing = false,
  onToggleEdit,
  onAddWidget,
  onUpdateWidget,
  onDeleteWidget,
  onDuplicateWidget,
  onReorderWidgets,
  onSave,
  onSettings,
  onShare,
  renderWidgetContent,
}: DashboardBuilderProps) {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => {
      // Sort by row (position_y) first, then by column (position_x)
      if (a.position_y !== b.position_y) return a.position_y - b.position_y;
      return a.position_x - b.position_x;
    });
  }, [widgets]);

  const handleDragStart = useCallback((e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetWidgetId) {
      setDraggedWidget(null);
      return;
    }

    const currentOrder = sortedWidgets.map(w => w.id);
    const draggedIndex = currentOrder.indexOf(draggedWidget);
    const targetIndex = currentOrder.indexOf(targetWidgetId);

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedWidget);

    onReorderWidgets?.(newOrder);
    setDraggedWidget(null);
  }, [draggedWidget, sortedWidgets, onReorderWidgets]);

  const handleSelectTemplate = useCallback((template: WidgetTemplate) => {
    onAddWidget?.(template);
    setShowWidgetPicker(false);
  }, [onAddWidget]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{dashboard.name}</h2>
          {dashboard.description && (
            <p className="text-muted-foreground">{dashboard.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setShowWidgetPicker(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Widget
              </Button>
              <Button variant="outline" onClick={onSettings}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button onClick={onSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button variant="ghost" onClick={onToggleEdit}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button onClick={onToggleEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Widget Grid */}
      <div 
        className={cn(
          'grid gap-4',
          dashboard.columns === 2 && 'grid-cols-2',
          dashboard.columns === 3 && 'grid-cols-3',
          dashboard.columns === 4 && 'grid-cols-4',
          (!dashboard.columns || dashboard.columns === 1) && 'grid-cols-1',
        )}
        style={{
          gridAutoRows: dashboard.row_height || 'minmax(200px, auto)',
        }}
      >
        {sortedWidgets.map((widget) => (
          <div
            key={widget.id}
            className={cn(
              'transition-all',
              draggedWidget === widget.id && 'opacity-50',
            )}
            style={{
              gridColumn: `span ${widget.width}`,
              gridRow: `span ${widget.height}`,
            }}
            draggable={isEditing}
            onDragStart={(e) => handleDragStart(e, widget.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, widget.id)}
          >
            <DashboardWidget
              widget={widget}
              isEditing={isEditing}
              onDelete={onDeleteWidget}
              onDuplicate={onDuplicateWidget}
              onSettings={(id) => {
                // Handle widget settings
              }}
            >
              {renderWidgetContent?.(widget)}
            </DashboardWidget>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {widgets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-medium">No widgets yet</h3>
            <p className="text-muted-foreground mt-1">
              Add widgets to customize your dashboard
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setShowWidgetPicker(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Widget
            </Button>
          </div>
        </div>
      )}

      {/* Widget Picker Dialog */}
      <WidgetPicker
        open={showWidgetPicker}
        onOpenChange={setShowWidgetPicker}
        templates={widgetTemplates}
        onSelect={handleSelectTemplate}
      />
    </div>
  );
}
