'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/src/components/ui/dialog';
import { Label } from '@/src/components/ui/label';
import { Input } from '@/src/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { 
  GitBranch, 
  AlertTriangle, 
  Plus, 
  Trash2,
  ArrowRight,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { dependenciesApi, tasksApi } from '@/src/lib/api-client';
import type { TaskScheduleDependency, DependencyBottleneck, Task } from '@/src/types';
import { toast } from 'sonner';

const DEPENDENCY_TYPES = [
  { value: 'finish_to_start', label: 'Finish to Start', description: 'Task B starts when Task A finishes' },
  { value: 'start_to_start', label: 'Start to Start', description: 'Tasks start together' },
  { value: 'finish_to_finish', label: 'Finish to Finish', description: 'Tasks finish together' },
  { value: 'start_to_finish', label: 'Start to Finish', description: 'Task B finishes when Task A starts' },
];

export default function DependenciesPage() {
  const [dependencies, setDependencies] = useState<TaskScheduleDependency[]>([]);
  const [bottlenecks, setBottlenecks] = useState<DependencyBottleneck[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    predecessor: '',
    successor: '',
    dependency_type: 'finish_to_start',
    lag_days: 0,
    auto_adjust_dates: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [depsData, bottlenecksData, tasksData] = await Promise.all([
        dependenciesApi.list(),
        dependenciesApi.getBottlenecks(),
        tasksApi.list(),
      ]);
      setDependencies(depsData);
      setBottlenecks(bottlenecksData);
      setTasks(tasksData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.predecessor || !formData.successor) {
      toast.error('Please select both predecessor and successor tasks');
      return;
    }
    if (formData.predecessor === formData.successor) {
      toast.error('A task cannot depend on itself');
      return;
    }
    try {
      await dependenciesApi.create({
        predecessor: formData.predecessor,
        successor: formData.successor,
        dependency_type: formData.dependency_type,
        lag_days: formData.lag_days,
        auto_adjust_dates: formData.auto_adjust_dates,
      });
      toast.success('Dependency created');
      setShowCreateDialog(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create dependency');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dependency?')) return;
    try {
      await dependenciesApi.delete(id);
      toast.success('Dependency deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete dependency');
    }
  };

  const handleResolveBottleneck = async (id: string) => {
    try {
      await dependenciesApi.resolveBottleneck(id);
      toast.success('Bottleneck marked as resolved');
      fetchData();
    } catch (error) {
      toast.error('Failed to resolve bottleneck');
    }
  };

  const resetForm = () => {
    setFormData({
      predecessor: '',
      successor: '',
      dependency_type: 'finish_to_start',
      lag_days: 0,
      auto_adjust_dates: true,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTaskTitle = (id: string) => {
    return tasks.find(t => t.id === id)?.title || id;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Dependencies</h1>
          <p className="text-muted-foreground">
            Manage task relationships and identify bottlenecks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Dependency
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Task Dependency</DialogTitle>
                <DialogDescription>
                  Define how tasks depend on each other
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Predecessor Task (must complete first)</Label>
                  <Select
                    value={formData.predecessor}
                    onValueChange={(value) => setFormData({ ...formData, predecessor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label>Successor Task (depends on predecessor)</Label>
                  <Select
                    value={formData.successor}
                    onValueChange={(value) => setFormData({ ...formData, successor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dependency Type</Label>
                  <Select
                    value={formData.dependency_type}
                    onValueChange={(value) => setFormData({ ...formData, dependency_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPENDENCY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {DEPENDENCY_TYPES.find(t => t.value === formData.dependency_type)?.description}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Lag Days</Label>
                  <Input
                    type="number"
                    value={formData.lag_days}
                    onChange={(e) => setFormData({ ...formData, lag_days: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Days to wait after the dependency condition is met
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create Dependency</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dependencies</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dependencies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bottlenecks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bottlenecks.filter(b => !b.is_resolved).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Bottlenecks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bottlenecks.filter(b => b.severity === 'critical' && !b.is_resolved).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dependencies">
        <TabsList>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="bottlenecks">
            Bottlenecks
            {bottlenecks.filter(b => !b.is_resolved).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {bottlenecks.filter(b => !b.is_resolved).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dependencies" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : dependencies.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No dependencies yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create dependencies to manage task relationships
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Dependency
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {dependencies.map((dep) => (
                <Card key={dep.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{dep.predecessor_title || getTaskTitle(dep.predecessor)}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{dep.successor_title || getTaskTitle(dep.successor)}</span>
                        </div>
                        <Badge variant="outline">{dep.dependency_type_display || dep.dependency_type}</Badge>
                        {dep.lag_days > 0 && (
                          <Badge variant="secondary">+{dep.lag_days} days lag</Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(dep.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          {bottlenecks.filter(b => !b.is_resolved).length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">No bottlenecks detected</h3>
                  <p className="text-muted-foreground">
                    Your task dependencies are healthy
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bottlenecks.filter(b => !b.is_resolved).map((bottleneck) => (
                <Card key={bottleneck.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(bottleneck.severity)}>
                          {bottleneck.severity.toUpperCase()}
                        </Badge>
                        <CardTitle className="text-lg">{bottleneck.task_title}</CardTitle>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleResolveBottleneck(bottleneck.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Resolved
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Blocking</p>
                        <p className="text-lg font-semibold">{bottleneck.blocking_count} tasks</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cascade Delay</p>
                        <p className="text-lg font-semibold">{bottleneck.cascade_delay_days} days</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Delay Probability</p>
                        <p className="text-lg font-semibold">{Math.round(bottleneck.delay_probability * 100)}%</p>
                      </div>
                      {bottleneck.affected_deadline && (
                        <div>
                          <p className="text-sm text-muted-foreground">Affected Deadline</p>
                          <p className="text-lg font-semibold">
                            {new Date(bottleneck.affected_deadline).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    {bottleneck.suggested_actions && bottleneck.suggested_actions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Suggested Actions:</p>
                        <ul className="space-y-1">
                          {bottleneck.suggested_actions.map((action, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{action.action}:</span>
                              <span className="text-muted-foreground">{action.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
