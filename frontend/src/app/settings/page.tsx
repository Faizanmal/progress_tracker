'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Switch } from '@/src/components/ui/switch';
import { Label } from '@/src/components/ui/label';
import { Input } from '@/src/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Separator } from '@/src/components/ui/separator';
import { 
  Settings, 
  Bell, 
  Mail, 
  Smartphone,
  Clock,
  Link2,
  Calendar,
  Save,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/src/hooks/use-auth';
import type { NotificationPreference } from '../../types';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-gray-500" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your preferences and integrations
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <IntegrationSettings />
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <ProfileSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreference>({
    id: '',
    user: '',
    email_task_assigned: true,
    email_task_blocked: true,
    email_task_overdue: true,
    email_progress_update: true,
    email_comment_added: true,
    email_reminder: true,
    email_timesheet: true,
    email_milestone: true,
    email_report: true,
    email_frequency: 'immediate',
    push_enabled: true,
    push_task_assigned: true,
    push_task_blocked: true,
    push_task_overdue: true,
    push_progress_update: false,
    push_comment_added: true,
    push_reminder: true,
    inapp_enabled: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    webhook_url: '',
    webhook_enabled: false,
    created_at: '',
    updated_at: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Show success toast
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure which notifications you receive via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Email Frequency</Label>
            <Select 
              value={preferences.email_frequency} 
              onValueChange={(value: any) => setPreferences({...preferences, email_frequency: value})}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Task Assigned</Label>
                <p className="text-sm text-muted-foreground">When a task is assigned to you</p>
              </div>
              <Switch 
                checked={preferences.email_task_assigned}
                onCheckedChange={(checked) => setPreferences({...preferences, email_task_assigned: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Task Blocked</Label>
                <p className="text-sm text-muted-foreground">When a team member reports a blocker</p>
              </div>
              <Switch 
                checked={preferences.email_task_blocked}
                onCheckedChange={(checked) => setPreferences({...preferences, email_task_blocked: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Task Overdue</Label>
                <p className="text-sm text-muted-foreground">When a task becomes overdue</p>
              </div>
              <Switch 
                checked={preferences.email_task_overdue}
                onCheckedChange={(checked) => setPreferences({...preferences, email_task_overdue: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Progress Updates</Label>
                <p className="text-sm text-muted-foreground">When progress is reported on your tasks</p>
              </div>
              <Switch 
                checked={preferences.email_progress_update}
                onCheckedChange={(checked) => setPreferences({...preferences, email_progress_update: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Comments</Label>
                <p className="text-sm text-muted-foreground">When someone comments on your items</p>
              </div>
              <Switch 
                checked={preferences.email_comment_added}
                onCheckedChange={(checked) => setPreferences({...preferences, email_comment_added: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Reminders</Label>
                <p className="text-sm text-muted-foreground">Daily progress reminders</p>
              </div>
              <Switch 
                checked={preferences.email_reminder}
                onCheckedChange={(checked) => setPreferences({...preferences, email_reminder: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Timesheet Updates</Label>
                <p className="text-sm text-muted-foreground">When timesheets are approved/rejected</p>
              </div>
              <Switch 
                checked={preferences.email_timesheet}
                onCheckedChange={(checked) => setPreferences({...preferences, email_timesheet: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Milestone Alerts</Label>
                <p className="text-sm text-muted-foreground">When milestones are due or completed</p>
              </div>
              <Switch 
                checked={preferences.email_milestone}
                onCheckedChange={(checked) => setPreferences({...preferences, email_milestone: checked})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Configure browser push notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
            </div>
            <Switch 
              checked={preferences.push_enabled}
              onCheckedChange={(checked) => setPreferences({...preferences, push_enabled: checked})}
            />
          </div>

          {preferences.push_enabled && (
            <>
              <Separator />
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label>Task Assigned</Label>
                  <Switch 
                    checked={preferences.push_task_assigned}
                    onCheckedChange={(checked) => setPreferences({...preferences, push_task_assigned: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Task Blocked</Label>
                  <Switch 
                    checked={preferences.push_task_blocked}
                    onCheckedChange={(checked) => setPreferences({...preferences, push_task_blocked: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Task Overdue</Label>
                  <Switch 
                    checked={preferences.push_task_overdue}
                    onCheckedChange={(checked) => setPreferences({...preferences, push_task_overdue: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Comments</Label>
                  <Switch 
                    checked={preferences.push_comment_added}
                    onCheckedChange={(checked) => setPreferences({...preferences, push_comment_added: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Reminders</Label>
                  <Switch 
                    checked={preferences.push_reminder}
                    onCheckedChange={(checked) => setPreferences({...preferences, push_reminder: checked})}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Pause notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">Silence notifications during set times</p>
            </div>
            <Switch 
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(checked) => setPreferences({...preferences, quiet_hours_enabled: checked})}
            />
          </div>

          {preferences.quiet_hours_enabled && (
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input 
                  type="time"
                  value={preferences.quiet_hours_start || '22:00'}
                  onChange={(e) => setPreferences({...preferences, quiet_hours_start: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input 
                  type="time"
                  value={preferences.quiet_hours_end || '08:00'}
                  onChange={(e) => setPreferences({...preferences, quiet_hours_end: e.target.value})}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Personal Webhook
          </CardTitle>
          <CardDescription>
            Send notifications to a custom webhook URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Webhook</Label>
              <p className="text-sm text-muted-foreground">Forward notifications to your webhook</p>
            </div>
            <Switch 
              checked={preferences.webhook_enabled}
              onCheckedChange={(checked) => setPreferences({...preferences, webhook_enabled: checked})}
            />
          </div>

          {preferences.webhook_enabled && (
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input 
                type="url"
                placeholder="https://your-webhook.example.com"
                value={preferences.webhook_url || ''}
                onChange={(e) => setPreferences({...preferences, webhook_url: e.target.value})}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

function IntegrationSettings() {
  return (
    <div className="space-y-6">
      {/* Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Sync your tasks and deadlines with external calendars
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">G</span>
                </div>
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">Sync with Google Calendar</p>
                </div>
              </div>
              <Button variant="outline">Connect</Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">O</span>
                </div>
                <div>
                  <p className="font-medium">Microsoft Outlook</p>
                  <p className="text-sm text-muted-foreground">Sync with Outlook Calendar</p>
                </div>
              </div>
              <Button variant="outline">Connect</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slack/Teams Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Team Notifications
          </CardTitle>
          <CardDescription>
            Send notifications to Slack or Microsoft Teams
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">S</span>
                </div>
                <div>
                  <p className="font-medium">Slack</p>
                  <p className="text-sm text-muted-foreground">Send notifications to Slack channels</p>
                </div>
              </div>
              <Button variant="outline">Configure</Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">T</span>
                </div>
                <div>
                  <p className="font-medium">Microsoft Teams</p>
                  <p className="text-sm text-muted-foreground">Send notifications to Teams channels</p>
                </div>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    department: '',
    position: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={profile.email}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input 
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input 
                value={profile.department}
                onChange={(e) => setProfile({...profile, department: e.target.value})}
                placeholder="Engineering"
              />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input 
                value={profile.position}
                onChange={(e) => setProfile({...profile, position: e.target.value})}
                placeholder="Software Engineer"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
