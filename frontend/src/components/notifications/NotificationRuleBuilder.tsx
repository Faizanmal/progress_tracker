'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { NotificationRule, NotificationTrigger, NotificationChannel } from '@/types';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Globe, 
  Users,
  Clock,
  Zap,
  Plus,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationRuleBuilderProps {
  rule?: Partial<NotificationRule>;
  onSave: (rule: Partial<NotificationRule>) => void;
  onCancel: () => void;
}

const triggerTypes: { value: NotificationTrigger; label: string; description: string; hasThreshold?: boolean }[] = [
  { value: 'task_assigned', label: 'Task Assigned', description: 'When a task is assigned to someone' },
  { value: 'task_completed', label: 'Task Completed', description: 'When a task is marked as complete' },
  { value: 'task_overdue_days', label: 'Task Overdue', description: 'When a task is overdue by X days', hasThreshold: true },
  { value: 'task_due_soon_hours', label: 'Task Due Soon', description: 'When a task is due within X hours', hasThreshold: true },
  { value: 'task_blocked', label: 'Task Blocked', description: 'When a task is marked as blocked' },
  { value: 'progress_below_threshold', label: 'Low Progress', description: 'When progress falls below X%', hasThreshold: true },
  { value: 'budget_threshold', label: 'Budget Threshold', description: 'When budget usage exceeds X%', hasThreshold: true },
  { value: 'milestone_approaching_days', label: 'Milestone Approaching', description: 'When a milestone is X days away', hasThreshold: true },
  { value: 'milestone_completed', label: 'Milestone Completed', description: 'When a milestone is completed' },
  { value: 'comment_added', label: 'Comment Added', description: 'When a comment is added to a task' },
  { value: 'mention', label: 'Mentioned', description: 'When someone mentions you' },
];

const channelOptions: { value: NotificationChannel; label: string; icon: React.ReactNode }[] = [
  { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { value: 'push', label: 'Push', icon: <Smartphone className="w-4 h-4" /> },
  { value: 'in_app', label: 'In-App', icon: <Bell className="w-4 h-4" /> },
  { value: 'slack', label: 'Slack', icon: <MessageSquare className="w-4 h-4" /> },
  { value: 'teams', label: 'Teams', icon: <MessageSquare className="w-4 h-4" /> },
  { value: 'webhook', label: 'Webhook', icon: <Globe className="w-4 h-4" /> },
];

const recipientTypes = [
  { value: 'task_assignee', label: 'Task Assignee', description: 'The person assigned to the task' },
  { value: 'project_team', label: 'Project Team', description: 'All members of the project' },
  { value: 'specific_users', label: 'Specific Users', description: 'Select specific users' },
  { value: 'role_based', label: 'By Role', description: 'Users with specific roles' },
];

export function NotificationRuleBuilder({ rule, onSave, onCancel }: NotificationRuleBuilderProps) {
  const [formData, setFormData] = useState<Partial<NotificationRule>>({
    name: '',
    description: '',
    trigger_type: 'task_assigned',
    trigger_conditions: {},
    channels: ['in_app'],
    recipients_type: 'task_assignee',
    specific_recipients: [],
    message_template: '',
    is_active: true,
    ...rule,
  });

  const selectedTrigger = triggerTypes.find(t => t.value === formData.trigger_type);

  const handleChannelToggle = (channel: NotificationChannel) => {
    setFormData(prev => {
      const channels = prev.channels || [];
      if (channels.includes(channel)) {
        return { ...prev, channels: channels.filter(c => c !== channel) };
      } else {
        return { ...prev, channels: [...channels, channel] };
      }
    });
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rule Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Task overdue reminder"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this rule does..."
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trigger */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Trigger
          </CardTitle>
          <CardDescription>When should this notification be sent?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {triggerTypes.map((trigger) => (
              <button
                key={trigger.value}
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  trigger_type: trigger.value,
                  trigger_conditions: {} 
                }))}
                className={cn(
                  'p-3 border rounded-lg text-left transition-colors',
                  formData.trigger_type === trigger.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                )}
              >
                <div className="font-medium text-sm">{trigger.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{trigger.description}</div>
              </button>
            ))}
          </div>

          {selectedTrigger?.hasThreshold && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Threshold Value</Label>
              <Input
                type="number"
                value={formData.trigger_conditions?.threshold || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  trigger_conditions: { 
                    ...prev.trigger_conditions, 
                    threshold: parseInt(e.target.value) 
                  }
                }))}
                placeholder={
                  formData.trigger_type?.includes('days') ? 'Number of days' :
                  formData.trigger_type?.includes('hours') ? 'Number of hours' :
                  'Percentage value'
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Delivery Channels
          </CardTitle>
          <CardDescription>How should the notification be delivered?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {channelOptions.map((channel) => (
              <button
                key={channel.value}
                onClick={() => handleChannelToggle(channel.value)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors',
                  formData.channels?.includes(channel.value)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:border-primary/50'
                )}
              >
                {channel.icon}
                <span className="text-sm font-medium">{channel.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Recipients
          </CardTitle>
          <CardDescription>Who should receive this notification?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={formData.recipients_type}
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              recipients_type: value as NotificationRule['recipients_type']
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select recipient type" />
            </SelectTrigger>
            <SelectContent>
              {recipientTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Message Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Message Template</CardTitle>
          <CardDescription>
            Customize the notification message. Use {'{{variable}}'} for dynamic content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.channels?.includes('email') && (
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={formData.subject_template || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, subject_template: e.target.value }))}
                placeholder="e.g., Task {{task_title}} is overdue"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message_template || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
              placeholder="e.g., The task '{{task_title}}' is overdue by {{days}} days. Please take action."
              rows={4}
            />
            <div className="text-xs text-muted-foreground">
              Available variables: {'{{task_title}}'}, {'{{project_name}}'}, {'{{assignee_name}}'}, {'{{due_date}}'}, {'{{days}}'}, {'{{threshold}}'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {rule?.id ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </div>
  );
}
