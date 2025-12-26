'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Switch } from '@/src/components/ui/switch';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/src/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { 
  AlertTriangle, 
  Plus, 
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  Bell,
  Mail,
  MessageSquare,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { escalationsApi } from '@/src/lib/api-client';
import type { EscalationRule, Escalation } from '@/src/types';
import { toast } from 'sonner';

const TRIGGER_TYPES = [
  { value: 'task_overdue', label: 'Task Overdue' },
  { value: 'task_blocked', label: 'Task Blocked' },
  { value: 'no_progress', label: 'No Progress Update' },
  { value: 'sla_breach', label: 'SLA Breach' },
];

export default function EscalationsPage() {
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'task_overdue',
    trigger_after_hours: 24,
    priority_filter: '',
    escalate_to_manager: true,
    send_email: true,
    send_notification: true,
    send_slack: false,
    auto_reassign: false,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesData, escalationsData] = await Promise.all([
        escalationsApi.listRules(),
        escalationsApi.list(),
      ]);
      setRules(rulesData);
      setEscalations(escalationsData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      await escalationsApi.createRule(formData);
      toast.success('Escalation rule created');
      setShowCreateDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to create rule');
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;
    try {
      await escalationsApi.updateRule(editingRule.id, formData);
      toast.success('Escalation rule updated');
      setEditingRule(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to update rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await escalationsApi.deleteRule(id);
      toast.success('Escalation rule deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await escalationsApi.acknowledge(id);
      toast.success('Escalation acknowledged');
      fetchData();
    } catch (error) {
      toast.error('Failed to acknowledge');
    }
  };

  const handleStartProgress = async (id: string) => {
    try {
      await escalationsApi.startProgress(id);
      toast.success('Started working on escalation');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleResolve = async (id: string) => {
    const notes = prompt('Resolution notes (optional):');
    try {
      await escalationsApi.resolve(id, notes || undefined);
      toast.success('Escalation resolved');
      fetchData();
    } catch (error) {
      toast.error('Failed to resolve');
    }
  };

  const handleDismiss = async (id: string) => {
    const notes = prompt('Reason for dismissal:');
    if (!notes) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      await escalationsApi.dismiss(id, notes);
      toast.success('Escalation dismissed');
      fetchData();
    } catch (error) {
      toast.error('Failed to dismiss');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_type: 'task_overdue',
      trigger_after_hours: 24,
      priority_filter: '',
      escalate_to_manager: true,
      send_email: true,
      send_notification: true,
      send_slack: false,
      auto_reassign: false,
      is_active: true,
    });
  };

  const openEditDialog = (rule: EscalationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      trigger_type: rule.trigger_type,
      trigger_after_hours: rule.trigger_after_hours,
      priority_filter: rule.priority_filter || '',
      escalate_to_manager: rule.escalate_to_manager,
      send_email: rule.send_email,
      send_notification: rule.send_notification,
      send_slack: rule.send_slack,
      auto_reassign: rule.auto_reassign,
      is_active: rule.is_active,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'acknowledged':
        return <Badge variant="secondary"><Bell className="w-3 h-3 mr-1" />Acknowledged</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500"><RefreshCw className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="outline">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Escalation System</h1>
          <p className="text-muted-foreground">
            Manage automated escalation rules and active escalations
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Escalation Rule</DialogTitle>
              <DialogDescription>
                Define when and how tasks should be escalated
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Escalate Overdue High Priority Tasks"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe when this rule triggers..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
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
                <div className="space-y-2">
                  <Label>Trigger After (hours)</Label>
                  <Input
                    type="number"
                    value={formData.trigger_after_hours}
                    onChange={(e) => setFormData({ ...formData, trigger_after_hours: parseInt(e.target.value) || 0 })}
                    min={1}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Priority Filter (optional)</Label>
                <Select
                  value={formData.priority_filter}
                  onValueChange={(value) => setFormData({ ...formData, priority_filter: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Notification Channels</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.send_notification}
                      onCheckedChange={(checked) => setFormData({ ...formData, send_notification: checked })}
                    />
                    <Label className="flex items-center gap-1">
                      <Bell className="w-4 h-4" /> In-App
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.send_email}
                      onCheckedChange={(checked) => setFormData({ ...formData, send_email: checked })}
                    />
                    <Label className="flex items-center gap-1">
                      <Mail className="w-4 h-4" /> Email
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.send_slack}
                      onCheckedChange={(checked) => setFormData({ ...formData, send_slack: checked })}
                    />
                    <Label className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" /> Slack
                    </Label>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Actions</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.escalate_to_manager}
                      onCheckedChange={(checked) => setFormData({ ...formData, escalate_to_manager: checked })}
                    />
                    <Label>Escalate to Manager</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.auto_reassign}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_reassign: checked })}
                    />
                    <Label className="flex items-center gap-1">
                      <UserPlus className="w-4 h-4" /> Auto-Reassign
                    </Label>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Rule Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateRule}>Create Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Escalation Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trigger Type</Label>
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
              <div className="space-y-2">
                <Label>Trigger After (hours)</Label>
                <Input
                  type="number"
                  value={formData.trigger_after_hours}
                  onChange={(e) => setFormData({ ...formData, trigger_after_hours: parseInt(e.target.value) || 0 })}
                  min={1}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Rule Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRule(null)}>Cancel</Button>
            <Button onClick={handleUpdateRule}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalations.filter(e => e.status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalations.filter(e => e.status === 'in_progress').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {escalations.filter(e => 
                e.status === 'resolved' && 
                e.resolved_at && 
                new Date(e.resolved_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="escalations">
        <TabsList>
          <TabsTrigger value="escalations">
            Active Escalations
            {escalations.filter(e => e.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {escalations.filter(e => e.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="escalations" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : escalations.filter(e => e.status !== 'resolved' && e.status !== 'dismissed').length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">No active escalations</h3>
                  <p className="text-muted-foreground">
                    All escalations have been resolved
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {escalations
                .filter(e => e.status !== 'resolved' && e.status !== 'dismissed')
                .map((escalation) => (
                  <Card key={escalation.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusBadge(escalation.status)}
                          <CardTitle className="text-lg">{escalation.task_title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {escalation.status === 'pending' && (
                            <Button variant="outline" size="sm" onClick={() => handleAcknowledge(escalation.id)}>
                              Acknowledge
                            </Button>
                          )}
                          {escalation.status === 'acknowledged' && (
                            <Button variant="outline" size="sm" onClick={() => handleStartProgress(escalation.id)}>
                              Start Progress
                            </Button>
                          )}
                          <Button variant="default" size="sm" onClick={() => handleResolve(escalation.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDismiss(escalation.id)}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-2">{escalation.reason}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {new Date(escalation.created_at).toLocaleString()}</span>
                        {escalation.acknowledged_at && (
                          <span>Acknowledged: {new Date(escalation.acknowledged_at).toLocaleString()}</span>
                        )}
                      </div>
                      {escalation.suggested_actions && escalation.suggested_actions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Suggested Actions:</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {escalation.suggested_actions.map((action, index) => (
                              <li key={index}>{action.action}: {action.description}</li>
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

        <TabsContent value="rules" className="space-y-4">
          {rules.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No escalation rules</h3>
                  <p className="text-muted-foreground mb-4">
                    Create rules to automatically escalate issues
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Paused'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(rule)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{rule.trigger_type_display || rule.trigger_type}</Badge>
                      <Badge variant="outline">After {rule.trigger_after_hours}h</Badge>
                      {rule.priority_filter && <Badge variant="outline">{rule.priority_filter} priority</Badge>}
                      {rule.send_notification && <Badge variant="secondary"><Bell className="w-3 h-3 mr-1" />In-App</Badge>}
                      {rule.send_email && <Badge variant="secondary"><Mail className="w-3 h-3 mr-1" />Email</Badge>}
                      {rule.send_slack && <Badge variant="secondary"><MessageSquare className="w-3 h-3 mr-1" />Slack</Badge>}
                      {rule.auto_reassign && <Badge variant="secondary"><UserPlus className="w-3 h-3 mr-1" />Auto-Reassign</Badge>}
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
