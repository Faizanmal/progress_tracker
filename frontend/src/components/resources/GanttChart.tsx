'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GanttChartData } from '@/types';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GanttChartProps {
  data: GanttChartData[];
  startDate?: string;
  endDate?: string;
  onItemClick?: (item: GanttChartData) => void;
  onDateRangeChange?: (start: string, end: string) => void;
}

type ZoomLevel = 'day' | 'week' | 'month';

const itemColors: Record<string, string> = {
  project: 'bg-blue-500',
  task: 'bg-green-500',
  milestone: 'bg-purple-500',
  allocation: 'bg-amber-500',
};

function getDateRange(items: GanttChartData[]): { start: Date; end: Date } {
  let minDate = new Date();
  let maxDate = new Date();

  items.forEach(item => {
    const start = new Date(item.start);
    const end = new Date(item.end);
    if (start < minDate) minDate = start;
    if (end > maxDate) maxDate = end;
  });

  // Add some padding
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 7);

  return { start: minDate, end: maxDate };
}

function generateDateColumns(start: Date, end: Date, zoom: ZoomLevel): { date: Date; label: string }[] {
  const columns: { date: Date; label: string }[] = [];
  const current = new Date(start);

  while (current <= end) {
    let label = '';
    if (zoom === 'day') {
      label = current.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } else if (zoom === 'week') {
      label = `W${getWeekNumber(current)}`;
    } else {
      label = current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }

    columns.push({ date: new Date(current), label });

    if (zoom === 'day') {
      current.setDate(current.getDate() + 1);
    } else if (zoom === 'week') {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }

  return columns;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function calculateBarPosition(
  itemStart: Date,
  itemEnd: Date,
  rangeStart: Date,
  rangeEnd: Date,
  containerWidth: number
): { left: number; width: number } {
  const totalDays = (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
  const startOffset = (itemStart.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
  const duration = (itemEnd.getTime() - itemStart.getTime()) / (1000 * 60 * 60 * 24);

  const left = (startOffset / totalDays) * containerWidth;
  const width = Math.max((duration / totalDays) * containerWidth, 20); // Min width of 20px

  return { left: Math.max(0, left), width };
}

export function GanttChart({
  data,
  startDate,
  endDate,
  onItemClick,
  onDateRangeChange,
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  
  const dateRange = useMemo(() => {
    if (startDate && endDate) {
      return { start: new Date(startDate), end: new Date(endDate) };
    }
    return getDateRange(data);
  }, [data, startDate, endDate]);

  const dateColumns = useMemo(() => 
    generateDateColumns(dateRange.start, dateRange.end, zoom),
    [dateRange, zoom]
  );

  const columnWidth = zoom === 'day' ? 40 : zoom === 'week' ? 100 : 120;
  const chartWidth = dateColumns.length * columnWidth;

  // Flatten items for rendering
  const flatItems = useMemo(() => {
    const result: (GanttChartData & { depth: number })[] = [];
    
    const flatten = (items: GanttChartData[], depth = 0) => {
      items.forEach(item => {
        result.push({ ...item, depth });
        if (item.children) {
          flatten(item.children, depth + 1);
        }
      });
    };
    
    flatten(data);
    return result;
  }, [data]);

  const handleZoomIn = () => {
    if (zoom === 'month') setZoom('week');
    else if (zoom === 'week') setZoom('day');
  };

  const handleZoomOut = () => {
    if (zoom === 'day') setZoom('week');
    else if (zoom === 'week') setZoom('month');
  };

  const scrollToToday = () => {
    if (containerRef.current) {
      const today = new Date();
      const totalDays = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
      const todayOffset = (today.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
      const scrollPosition = (todayOffset / totalDays) * chartWidth - containerRef.current.clientWidth / 2;
      containerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Project Timeline</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom === 'month'}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom === 'day'}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={scrollToToday}>
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex">
          {/* Left sidebar with item names */}
          <div className="w-60 shrink-0 border-r">
            <div className="h-10 border-b bg-muted/50 flex items-center px-4 font-medium text-sm">
              Task
            </div>
            {flatItems.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  'h-12 border-b flex items-center px-4 text-sm cursor-pointer hover:bg-muted/50',
                  item.is_critical_path && 'bg-red-50 dark:bg-red-950/20'
                )}
                style={{ paddingLeft: `${16 + item.depth * 16}px` }}
                onClick={() => onItemClick?.(item)}
              >
                <div className={cn(
                  'w-3 h-3 rounded-full mr-2 shrink-0',
                  item.color || itemColors[item.type]
                )} />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div 
            ref={containerRef}
            className="flex-1 overflow-x-auto"
          >
            <div style={{ width: chartWidth, minWidth: '100%' }}>
              {/* Date header */}
              <div className="h-10 border-b bg-muted/50 flex">
                {dateColumns.map((col, index) => (
                  <div
                    key={index}
                    className="shrink-0 flex items-center justify-center text-xs font-medium border-r"
                    style={{ width: columnWidth }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>

              {/* Bars */}
              {flatItems.map((item, index) => {
                const itemStart = new Date(item.start);
                const itemEnd = new Date(item.end);
                const { left, width } = calculateBarPosition(
                  itemStart,
                  itemEnd,
                  dateRange.start,
                  dateRange.end,
                  chartWidth
                );

                return (
                  <div
                    key={item.id}
                    className="h-12 border-b relative"
                  >
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {dateColumns.map((_, i) => (
                        <div
                          key={i}
                          className="shrink-0 border-r border-dashed border-muted"
                          style={{ width: columnWidth }}
                        />
                      ))}
                    </div>

                    {/* Bar */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'absolute top-2 h-8 rounded cursor-pointer transition-all hover:opacity-80',
                              item.color || itemColors[item.type],
                              item.type === 'milestone' && 'rounded-full w-4 h-4 top-4',
                              item.is_critical_path && 'ring-2 ring-red-500'
                            )}
                            style={{
                              left: `${left}px`,
                              width: item.type === 'milestone' ? '16px' : `${width}px`,
                            }}
                            onClick={() => onItemClick?.(item)}
                          >
                            {item.type !== 'milestone' && item.progress !== undefined && (
                              <div
                                className="absolute inset-0 bg-black/20 rounded"
                                style={{ 
                                  clipPath: `inset(0 ${100 - item.progress}% 0 0)` 
                                }}
                              />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs">
                              {new Date(item.start).toLocaleDateString()} - {new Date(item.end).toLocaleDateString()}
                            </div>
                            {item.progress !== undefined && (
                              <div className="text-xs">Progress: {item.progress}%</div>
                            )}
                            {item.assignee_name && (
                              <div className="text-xs">Assigned to: {item.assignee_name}</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
