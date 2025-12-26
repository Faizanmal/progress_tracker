'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Switch } from '@/src/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/src/components/ui/dialog';
import { 
  LayoutDashboard, 
  Plus, 
  Trash2,
  Edit,
  Star,
  GripVertical,
  BarChart3,
  PieChart,
  LineChart,
  ListTodo,
  Clock,
  Users,
  Activity,
  Settings
} from 'lucide-react';
import { dashboardsApi } from '@/src/lib/api-client';
import type { PersonalizedDashboard, DashboardWidget } from '@/src/types';
import { toast } from 'sonner';

const WIDGET_TYPES = [
  { value: 'task_summary', label: 'Task Summary', icon: ListTodo, description: 'Overview of your tasks' },
  { value: 'project_progress', label: 'Project Progress', icon: BarChart3, description: 'Progress bars for projects' },
  { value: 'time_tracking', label: 'Time Tracking', icon: Clock, description: 'Recent time entries' },
  { value: 'team_activity', label: 'Team Activity', icon: Users, description: 'Team member updates' },
  { value: 'burndown_chart', label: 'Burndown Chart', icon: LineChart, description: 'Sprint burndown visualization' },
  { value: 'priority_breakdown', label: 'Priority Breakdown', icon: PieChart, description: 'Tasks by priority' },
  { value: 'upcoming_deadlines', label: 'Upcoming Deadlines', icon: Clock, description: 'Tasks due soon' },
  { value: 'recent_activity', label: 'Recent Activity', icon: Activity, description: 'Latest updates feed' },
];

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<PersonalizedDashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<PersonalizedDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddWidgetDialog, setShowAddWidgetDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    auto_refresh: true,
    refresh_interval_seconds: 60,
  });
  const [widgetFormData, setWidgetFormData] = useState({
    widget_type: 'task_summary',
    title: '',
    width: 4,
    height: 2,
  });

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      const data = await dashboardsApi.list();
      setDashboards(data);
      if (data.length > 0 && !selectedDashboard) {
        const defaultDashboard = data.find((d: PersonalizedDashboard) => d.is_default) || data[0];
        fetchDashboard(defaultDashboard.id);
      }
    } catch (error) {
      toast.error('Failed to fetch dashboards');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async (id: string) => {
    try {
      const data = await dashboardsApi.get(id);
      setSelectedDashboard(data);
    } catch (error) {
      toast.error('Failed to fetch dashboard');
    }
  };

  const handleCreate = async () => {
    try {
      const data = await dashboardsApi.create(formData);
      toast.success('Dashboard created');
      setShowCreateDialog(false);
      resetForm();
      fetchDashboards();
      fetchDashboard(data.id);
    } catch (error) {
      toast.error('Failed to create dashboard');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;
    try {
      await dashboardsApi.delete(id);
      toast.success('Dashboard deleted');
      setSelectedDashboard(null);
      fetchDashboards();
    } catch (error) {
      toast.error('Failed to delete dashboard');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await dashboardsApi.setDefault(id);
      toast.success('Default dashboard set');
      fetchDashboards();
    } catch (error) {
      toast.error('Failed to set default');
    }
  };

  const handleAddWidget = async () => {
    if (!selectedDashboard) return;
    try {
      await dashboardsApi.addWidget(selectedDashboard.id, widgetFormData);
      toast.success('Widget added');
      setShowAddWidgetDialog(false);
      resetWidgetForm();
      fetchDashboard(selectedDashboard.id);
    } catch (error) {
      toast.error('Failed to add widget');
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm('Remove this widget?')) return;
    try {
      await dashboardsApi.deleteWidget(widgetId);
      toast.success('Widget removed');
      if (selectedDashboard) {
        fetchDashboard(selectedDashboard.id);
      }
    } catch (error) {
      toast.error('Failed to remove widget');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      auto_refresh: true,
      refresh_interval_seconds: 60,
    });
  };

  const resetWidgetForm = () => {
    setWidgetFormData({
      widget_type: 'task_summary',
      title: '',
      width: 4,
      height: 2,
    });
  };

  const getWidgetIcon = (type: string) => {
    const widgetType = WIDGET_TYPES.find(w => w.value === type);
    return widgetType ? widgetType.icon : LayoutDashboard;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personalized Dashboards</h1>
          <p className="text-muted-foreground">
            Create custom dashboards with drag-and-drop widgets
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Dashboard
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Dashboard</DialogTitle>
              <DialogDescription>
                Create a new personalized dashboard
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Dashboard Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Dashboard"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.auto_refresh}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_refresh: checked })}
                />
                <Label>Auto Refresh</Label>
              </div>
              {formData.auto_refresh && (
                <div className="space-y-2">
                  <Label>Refresh Interval (seconds)</Label>
                  <Select
                    value={formData.refresh_interval_seconds.toString()}
                    onValueChange={(value) => setFormData({ ...formData, refresh_interval_seconds: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="600">10 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Dashboard</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add Widget Dialog */}
      <Dialog open={showAddWidgetDialog} onOpenChange={setShowAddWidgetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
            <DialogDescription>
              Choose a widget to add to your dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {WIDGET_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = widgetFormData.widget_type === type.value;
                return (
                  <div
                    key={type.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => setWidgetFormData({ ...widgetFormData, widget_type: type.value })}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              <Label>Custom Title (optional)</Label>
              <Input
                value={widgetFormData.title}
                onChange={(e) => setWidgetFormData({ ...widgetFormData, title: e.target.value })}
                placeholder="Leave empty for default title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Width (columns)</Label>
                <Select
                  value={widgetFormData.width.toString()}
                  onValueChange={(value) => setWidgetFormData({ ...widgetFormData, width: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Small (2)</SelectItem>
                    <SelectItem value="4">Medium (4)</SelectItem>
                    <SelectItem value="6">Large (6)</SelectItem>
                    <SelectItem value="12">Full Width (12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Height (rows)</Label>
                <Select
                  value={widgetFormData.height.toString()}
                  onValueChange={(value) => setWidgetFormData({ ...widgetFormData, height: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Small (1)</SelectItem>
                    <SelectItem value="2">Medium (2)</SelectItem>
                    <SelectItem value="3">Large (3)</SelectItem>
                    <SelectItem value="4">Extra Large (4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWidgetDialog(false)}>Cancel</Button>
            <Button onClick={handleAddWidget}>Add Widget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Dashboard List */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">My Dashboards</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {dashboards.length === 0 ? (
                  <div className="text-center py-4">
                    <LayoutDashboard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No dashboards yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {dashboards.map((dashboard) => (
                      <div
                        key={dashboard.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                          selectedDashboard?.id === dashboard.id
                            ? 'bg-primary/10'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => fetchDashboard(dashboard.id)}
                      >
                        <div className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{dashboard.name}</span>
                          {dashboard.is_default && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Content */}
          <div className="col-span-9">
            {selectedDashboard ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>{selectedDashboard.name}</CardTitle>
                      <CardDescription>
                        {selectedDashboard.widgets?.length || 0} widgets
                        {selectedDashboard.auto_refresh && (
                          <span className="ml-2">• Auto-refresh every {selectedDashboard.refresh_interval_seconds}s</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {!selectedDashboard.is_default && (
                        <Button variant="outline" size="sm" onClick={() => handleSetDefault(selectedDashboard.id)}>
                          <Star className="w-4 h-4 mr-1" />
                          Set Default
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setShowAddWidgetDialog(true)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Widget
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(selectedDashboard.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Widgets Grid */}
                {(!selectedDashboard.widgets || selectedDashboard.widgets.length === 0) ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <LayoutDashboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No widgets yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Add widgets to customize your dashboard
                        </p>
                        <Button onClick={() => setShowAddWidgetDialog(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Widget
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-12 gap-4">
                    {selectedDashboard.widgets.map((widget) => {
                      const WidgetIcon = getWidgetIcon(widget.widget_type);
                      return (
                        <Card
                          key={widget.id}
                          className={`col-span-${widget.width || 4}`}
                          style={{ gridColumn: `span ${widget.width || 4}` }}
                        >
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                              <WidgetIcon className="h-4 w-4 text-muted-foreground" />
                              <CardTitle className="text-sm font-medium">
                                {widget.title || widget.widget_type_display || widget.widget_type}
                              </CardTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteWidget(widget.id)}>
                              <Trash2 className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          </CardHeader>
                          <CardContent>
                            <div className="h-32 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                              <div className="text-center">
                                <WidgetIcon className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">Widget preview</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <LayoutDashboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Select a dashboard</h3>
                    <p className="text-muted-foreground mb-4">
                      Choose a dashboard from the list or create a new one
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
