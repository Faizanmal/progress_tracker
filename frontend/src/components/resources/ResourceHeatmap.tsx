'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserCapacity, ResourceAllocation } from '@/types';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourceHeatmapProps {
  capacities: UserCapacity[];
  dateRange?: { start: string; end: string };
  onCellClick?: (userId: string, weekStart: string) => void;
}

function getUtilizationColor(percentage: number): string {
  if (percentage < 50) return 'bg-green-100 dark:bg-green-900/30';
  if (percentage < 75) return 'bg-green-300 dark:bg-green-700/50';
  if (percentage < 90) return 'bg-yellow-300 dark:bg-yellow-700/50';
  if (percentage < 100) return 'bg-orange-300 dark:bg-orange-700/50';
  return 'bg-red-400 dark:bg-red-700/50';
}

function getUtilizationTextColor(percentage: number): string {
  if (percentage < 50) return 'text-green-700 dark:text-green-300';
  if (percentage < 75) return 'text-green-800 dark:text-green-200';
  if (percentage < 90) return 'text-yellow-800 dark:text-yellow-200';
  if (percentage < 100) return 'text-orange-800 dark:text-orange-200';
  return 'text-red-800 dark:text-red-200';
}

export function ResourceHeatmap({ capacities, dateRange, onCellClick }: ResourceHeatmapProps) {
  // Group capacities by user
  const userCapacities = useMemo(() => {
    const grouped: Record<string, UserCapacity[]> = {};
    capacities.forEach(cap => {
      const userId = cap.user;
      if (!grouped[userId]) {
        grouped[userId] = [];
      }
      grouped[userId].push(cap);
    });
    return grouped;
  }, [capacities]);

  // Get unique weeks
  const weeks = useMemo(() => {
    const weekSet = new Set<string>();
    capacities.forEach(cap => weekSet.add(cap.week_start));
    return Array.from(weekSet).sort();
  }, [capacities]);

  const formatWeekLabel = (weekStart: string) => {
    const date = new Date(weekStart);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Utilization</CardTitle>
        <CardDescription>
          Team capacity heatmap showing allocation levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-muted-foreground p-2 sticky left-0 bg-background">
                  Team Member
                </th>
                {weeks.map(week => (
                  <th key={week} className="text-center text-xs font-medium text-muted-foreground p-2 min-w-[70px]">
                    {formatWeekLabel(week)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(userCapacities).map(([userId, caps]) => {
                const firstCap = caps[0];
                return (
                  <tr key={userId}>
                    <td className="p-2 sticky left-0 bg-background">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={firstCap.user_avatar} />
                          <AvatarFallback>
                            {firstCap.user_name?.slice(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium whitespace-nowrap">
                          {firstCap.user_name}
                        </span>
                      </div>
                    </td>
                    {weeks.map(week => {
                      const cap = caps.find(c => c.week_start === week);
                      const percentage = cap?.utilized_percentage || 0;
                      
                      return (
                        <td key={week} className="p-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => onCellClick?.(userId, week)}
                                  className={cn(
                                    'w-full h-10 rounded flex items-center justify-center transition-colors',
                                    getUtilizationColor(percentage),
                                    'hover:ring-2 hover:ring-primary/50'
                                  )}
                                >
                                  <span className={cn(
                                    'text-xs font-medium',
                                    getUtilizationTextColor(percentage)
                                  )}>
                                    {cap ? `${Math.round(percentage)}%` : '-'}
                                  </span>
                                  {cap?.is_overallocated && (
                                    <AlertTriangle className="w-3 h-3 ml-1 text-red-600" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    Week of {formatWeekLabel(week)}
                                  </div>
                                  {cap ? (
                                    <>
                                      <div>Allocated: {cap.allocated_hours}h / {cap.total_hours}h</div>
                                      <div>Available: {cap.available_hours}h</div>
                                      {cap.is_overallocated && (
                                        <div className="text-red-500">
                                          Overallocated by {cap.overallocation_hours}h
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-muted-foreground">No data</div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30" />
            <span>&lt;50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-300 dark:bg-green-700/50" />
            <span>50-75%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-300 dark:bg-yellow-700/50" />
            <span>75-90%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-orange-300 dark:bg-orange-700/50" />
            <span>90-100%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-400 dark:bg-red-700/50" />
            <span>&gt;100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
