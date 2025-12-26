'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import { Switch } from '@/src/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/src/components/ui/dialog';
import { Textarea } from '@/src/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { 
  Plus, 
  Zap, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  History,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Settings
} from 'lucide-react';
import { workflowsApi } from '@/src/lib/api-client';
import type { Workflow, WorkflowExecution } from '@/src/types';
import { toast } from 'sonner';

const TRIGGER_TYPES = [
  { value: 'task_created', label: 'Task Created' },
  { value: 'task_updated', label: 'Task Updated' },
  { value: 'task_completed', label: 'Task Completed' },
  { value: 'task_overdue', label: 'Task Overdue' },
  { value: 'task_blocked', label: 'Task Blocked' },
  { value: 'progress_update', label: 'Progress Update' },
  { value: 'comment_added', label: 'Comment Added' },
  { value: 'schedule', label: 'Scheduled' },
];

const ACTION_TYPES = [
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'send_email', label: 'Send Email' },
  { value: 'update_task_status', label: 'Update Task Status' },
  { value: 'assign_task', label: 'Assign Task' },
  { value: 'add_tag', label: 'Add Tag' },
  { value: 'create_subtask', label: 'Create Subtask' },
  { value: 'slack_message', label: 'Slack Message' },
  { value: 'teams_message', label: 'Teams Message' },
  { value: 'webhook', label: 'Call Webhook' },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'task_created',
    trigger_config: {} as Record<string, unknown>,
    is_active: true,
  });

  useEffect(() => {
    fetchWorkflows();
    fetchExecutions();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const data = await workflowsApi.list();
      setWorkflows(data);
    } catch (error) {
      toast.error('Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutions = async () => {
    try {
      const data = await workflowsApi.getExecutions();
      setExecutions(data);
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await workflowsApi.create(formData);
      toast.success('Workflow created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchWorkflows();
    } catch (error) {
      toast.error('Failed to create workflow');
    }
  };

  const handleUpdate = async () => {
    if (!editingWorkflow) return;
    try {
      await workflowsApi.update(editingWorkflow.id, formData);
      toast.success('Workflow updated successfully');
      setEditingWorkflow(null);
      resetForm();
      fetchWorkflows();
    } catch (error) {
      toast.error('Failed to update workflow');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await workflowsApi.delete(id);
      toast.success('Workflow deleted');
      fetchWorkflows();
    } catch (error) {
      toast.error('Failed to delete workflow');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await workflowsApi.toggle(id);
      toast.success('Workflow toggled');
      fetchWorkflows();
    } catch (error) {
      toast.error('Failed to toggle workflow');
    }
  };

  const handleTest = async (id: string) => {
    try {
      const result = await workflowsApi.test(id);
      toast.success(`Test completed: ${result.message || 'Success'}`);
    } catch (error) {
      toast.error('Test failed');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_type: 'task_created',
      trigger_config: {},
      is_active: true,
    });
  };

  const openEditDialog = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      trigger_type: workflow.trigger_type,
      trigger_config: workflow.trigger_config,
      is_active: workflow.is_active,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'running':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Running</Badge>;
      case 'skipped':
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Skipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Automation</h1>
          <p className="text-muted-foreground">
            Create automated workflows triggered by task events
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Set up automated actions triggered by task events
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Notify on High Priority Tasks"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this workflow does..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger Type</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Workflow</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingWorkflow} onOpenChange={(open) => !open && setEditingWorkflow(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Workflow</DialogTitle>
            <DialogDescription>
              Modify workflow settings and triggers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Workflow Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-trigger">Trigger Type</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWorkflow(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="workflows">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workflows" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : workflows.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No workflows yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first workflow to automate repetitive tasks
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${workflow.is_active ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <Zap className={`h-5 w-5 ${workflow.is_active ? 'text-green-600 dark:text-green-300' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                        {workflow.is_active ? 'Active' : 'Paused'}
                      </Badge>
                      <Badge variant="outline">{workflow.trigger_type_display || workflow.trigger_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Executed {workflow.execution_count} times</span>
                        {workflow.last_executed && (
                          <span>Last run: {new Date(workflow.last_executed).toLocaleString()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleTest(workflow.id)}>
                          <Play className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggle(workflow.id)}>
                          {workflow.is_active ? (
                            <><Pause className="w-4 h-4 mr-1" />Pause</>
                          ) : (
                            <><Play className="w-4 h-4 mr-1" />Activate</>
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(workflow)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(workflow.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {executions.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No executions yet</h3>
                  <p className="text-muted-foreground">
                    Workflow execution history will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {executions.map((execution) => (
                <Card key={execution.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusBadge(execution.status)}
                        <span className="font-medium">{execution.workflow_name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(execution.started_at).toLocaleString()}
                        {execution.completed_at && (
                          <span className="ml-2">
                            (Duration: {Math.round((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000)}s)
                          </span>
                        )}
                      </div>
                    </div>
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
