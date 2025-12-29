'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WidgetTemplate, WidgetType } from '@/types';
import { 
  Search, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Calendar, 
  ListTodo, 
  Users, 
  Clock, 
  DollarSign, 
  Bell,
  Activity,
  Target,
  Gauge,
  Table,
  FileText,
  Globe,
  Zap,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: WidgetTemplate[];
  onSelect: (template: WidgetTemplate) => void;
}

const widgetTypeIcons: Partial<Record<WidgetType, React.ReactNode>> = {
  task_completion_rate: <PieChart className="h-6 w-6" />,
  project_health: <Gauge className="h-6 w-6" />,
  team_workload: <Users className="h-6 w-6" />,
  time_tracking_summary: <Clock className="h-6 w-6" />,
  budget_overview: <DollarSign className="h-6 w-6" />,
  burndown_chart: <LineChart className="h-6 w-6" />,
  velocity_chart: <BarChart3 className="h-6 w-6" />,
  upcoming_deadlines: <Calendar className="h-6 w-6" />,
  recent_activity: <Activity className="h-6 w-6" />,
  notifications_feed: <Bell className="h-6 w-6" />,
  calendar_view: <Calendar className="h-6 w-6" />,
  resource_utilization: <Gauge className="h-6 w-6" />,
  task_list: <ListTodo className="h-6 w-6" />,
  milestone_tracker: <Target className="h-6 w-6" />,
  gantt_chart: <BarChart3 className="h-6 w-6" />,
  kanban_board: <ListTodo className="h-6 w-6" />,
  priority_matrix: <Table className="h-6 w-6" />,
  custom_chart: <BarChart3 className="h-6 w-6" />,
  custom_metric: <Gauge className="h-6 w-6" />,
  custom_table: <Table className="h-6 w-6" />,
  markdown_note: <FileText className="h-6 w-6" />,
  embedded_iframe: <Globe className="h-6 w-6" />,
  quick_actions: <Zap className="h-6 w-6" />,
};

const categoryLabels = {
  productivity: 'Productivity',
  projects: 'Projects',
  resources: 'Resources',
  time: 'Time Tracking',
  budget: 'Budget',
  custom: 'Custom',
};

export function WidgetPicker({ open, onOpenChange, templates, onSelect }: WidgetPickerProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        t => t.name.toLowerCase().includes(searchLower) ||
             t.description?.toLowerCase().includes(searchLower) ||
             t.widget_type.toLowerCase().includes(searchLower)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory);
    }

    return result;
  }, [templates, search, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category));
    return Array.from(cats);
  }, [templates]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>
            Choose a widget to add to your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search widgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat}>
                  {categoryLabels[cat as keyof typeof categoryLabels] || cat}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-2 gap-3">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => onSelect(template)}
                      className={cn(
                        'flex items-start gap-3 p-4 border rounded-lg text-left transition-colors',
                        'hover:bg-muted hover:border-primary/50',
                        template.is_premium && 'relative overflow-hidden'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-lg shrink-0',
                        'bg-primary/10 text-primary'
                      )}>
                        {widgetTypeIcons[template.widget_type] || <BarChart3 className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{template.name}</span>
                          {template.is_premium && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              Pro
                            </Badge>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}

                  {filteredTemplates.length === 0 && (
                    <div className="col-span-2 py-8 text-center text-muted-foreground">
                      No widgets found matching your search
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
