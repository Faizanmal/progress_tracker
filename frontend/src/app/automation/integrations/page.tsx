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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { 
  MessageSquare, 
  Plus, 
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  RefreshCw,
  Link,
  Unlink,
  Play,
  Github,
  GitBranch
} from 'lucide-react';
import { chatIntegrationsApi, gitIntegrationsApi } from '@/src/lib/api-client';
import type { ChatIntegration, GitIntegration, GitRepository } from '@/src/types';
import { toast } from 'sonner';

// Simple icons for platforms
const SlackIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
);

const TeamsIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.186 2.09c-.09-.093-.18-.186-.27-.28l-.01-.01c-.17-.17-.35-.34-.53-.5-.17-.16-.35-.31-.53-.46-.09-.08-.18-.15-.27-.22l-.01-.01c-.18-.14-.35-.27-.53-.4-.09-.06-.17-.12-.26-.18-.09-.06-.18-.13-.27-.19-.09-.06-.18-.12-.27-.17l-.01-.01c-.18-.11-.36-.22-.54-.32-.09-.05-.17-.1-.26-.15-.09-.05-.18-.1-.28-.15-.09-.05-.18-.1-.27-.14l-.01-.01c-.18-.09-.37-.18-.55-.27-.09-.04-.18-.08-.27-.13-.09-.04-.19-.08-.28-.13-.09-.04-.19-.08-.28-.12h-.01c-.19-.08-.38-.16-.57-.23-.09-.04-.19-.07-.28-.11-.1-.04-.19-.07-.29-.11-.1-.04-.19-.07-.29-.1h-.01c-.19-.06-.38-.13-.58-.19-.1-.03-.2-.06-.29-.09-.1-.03-.2-.06-.3-.08-.1-.03-.2-.05-.3-.08h-.01c-.2-.05-.39-.1-.59-.14-.1-.02-.2-.04-.3-.06-.1-.02-.2-.04-.31-.06-.1-.02-.21-.04-.31-.05h-.01c-.2-.03-.4-.06-.6-.09-.11-.01-.21-.03-.32-.04-.11-.01-.21-.02-.32-.03-.11-.01-.21-.02-.32-.03h-.01c-.21-.02-.41-.03-.62-.04-.11-.01-.22-.01-.33-.02-.11 0-.22-.01-.33-.01-.11 0-.22 0-.33-.01H12c-.11 0-.22 0-.33.01-.11 0-.22.01-.33.01-.11.01-.22.01-.33.02-.21.01-.41.02-.62.04h-.01c-.11.01-.21.02-.32.03-.11.01-.21.02-.32.03-.11.01-.21.03-.32.04-.2.03-.4.06-.6.09h-.01c-.1.01-.21.03-.31.05-.1.02-.2.04-.31.06-.1.02-.2.04-.3.06-.2.04-.39.09-.59.14h-.01c-.1.03-.2.05-.3.08-.1.02-.2.05-.3.08-.1.03-.2.06-.29.09-.2.06-.39.13-.58.19h-.01c-.1.03-.19.06-.29.1-.1.04-.19.07-.29.11-.09.04-.19.07-.28.11-.19.07-.38.15-.57.23h-.01c-.1.04-.19.08-.28.12-.1.05-.19.09-.28.13-.09.05-.18.09-.27.13-.18.09-.37.18-.55.27l-.01.01c-.09.04-.18.09-.27.14-.1.05-.19.1-.28.15-.09.05-.17.1-.26.15-.18.1-.36.21-.54.32l-.01.01c-.09.05-.18.11-.27.17-.09.06-.18.13-.27.19-.09.06-.17.12-.26.18-.18.13-.35.26-.53.4l-.01.01c-.09.07-.18.14-.27.22-.18.15-.36.3-.53.46-.18.16-.35.33-.53.5l-.01.01c-.09.094-.18.187-.27.28C.77 3.16.39 4.31.16 5.5.06 6.02 0 6.55 0 7.09v9.82c0 .54.06 1.07.16 1.59.23 1.19.61 2.34 1.75 3.41l.01.01c.09.09.18.19.27.28.18.17.35.34.53.5.17.16.35.31.53.46.09.08.18.15.27.22l.01.01c.18.14.35.27.53.4.09.06.17.12.26.18.09.06.18.13.27.19.09.06.18.12.27.17l.01.01c.18.11.36.22.54.32.09.05.17.1.26.15.09.05.18.1.28.15.09.05.18.1.27.14l.01.01c.18.09.37.18.55.27.09.04.18.08.27.13.09.04.19.08.28.13.09.04.19.08.28.12h.01c.19.08.38.16.57.23.09.04.19.07.28.11.1.04.19.07.29.11.1.04.19.07.29.1h.01c.19.06.38.13.58.19.1.03.2.06.29.09.1.03.2.06.3.08.1.03.2.05.3.08h.01c.2.05.39.1.59.14.1.02.2.04.3.06.1.02.2.04.31.06.1.02.21.04.31.05h.01c.2.03.4.06.6.09.11.01.21.03.32.04.11.01.21.02.32.03.11.01.21.02.32.03h.01c.21.02.41.03.62.04.11.01.22.01.33.02.11 0 .22.01.33.01.11 0 .22 0 .33.01H12c.11 0 .22 0 .33-.01.11 0 .22-.01.33-.01.11-.01.22-.01.33-.02.21-.01.41-.02.62-.04h.01c.11-.01.21-.02.32-.03.11-.01.21-.02.32-.03.11-.01.21-.03.32-.04.2-.03.4-.06.6-.09h.01c.1-.01.21-.03.31-.05.1-.02.2-.04.31-.06.1-.02.2-.04.3-.06.2-.04.39-.09.59-.14h.01c.1-.03.2-.05.3-.08.1-.02.2-.05.3-.08.1-.03.2-.06.29-.09.2-.06.39-.13.58-.19h.01c.1-.03.19-.06.29-.1.1-.04.19-.07.29-.11.09-.04.19-.07.28-.11.19-.07.38-.15.57-.23h.01c.1-.04.19-.08.28-.12.1-.05.19-.09.28-.13.09-.05.18-.09.27-.13.18-.09.37-.18.55-.27l.01-.01c.09-.04.18-.09.27-.14.1-.05.19-.1.28-.15.09-.05.17-.1.26-.15.18-.1.36-.21.54-.32l.01-.01c.09-.05.18-.11.27-.17.09-.06.18-.13.27-.19.09-.06.17-.12.26-.18.18-.13.35-.26.53-.4l.01-.01c.09-.07.18-.14.27-.22.18-.15.36-.3.53-.46.18-.16.35-.33.53-.5l.01-.01c.09-.09.18-.19.27-.28 1.14-1.07 1.52-2.22 1.75-3.41.1-.52.16-1.05.16-1.59V7.09c0-.54-.06-1.07-.16-1.59-.23-1.19-.61-2.34-1.75-3.41zM20 14.09a6 6 0 1 1-12 0 6 6 0 0 1 12 0z"/>
  </svg>
);

export default function IntegrationsPage() {
  const [chatIntegrations, setChatIntegrations] = useState<ChatIntegration[]>([]);
  const [gitIntegrations, setGitIntegrations] = useState<GitIntegration[]>([]);
  const [repositories, setRepositories] = useState<GitRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showGitDialog, setShowGitDialog] = useState(false);
  const [chatFormData, setChatFormData] = useState({
    platform: 'slack',
    workspace_id: '',
    workspace_name: '',
    notify_task_assigned: true,
    notify_task_completed: true,
    notify_daily_standup: false,
    standup_time: '09:00',
    is_active: true,
  });
  const [gitFormData, setGitFormData] = useState({
    platform: 'github',
    organization: '',
    sync_issues: true,
    sync_pull_requests: true,
    auto_create_tasks: false,
    auto_update_progress: true,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [chatData, gitData, reposData] = await Promise.all([
        chatIntegrationsApi.list().catch(() => []),
        gitIntegrationsApi.list().catch(() => []),
        gitIntegrationsApi.listRepos().catch(() => []),
      ]);
      setChatIntegrations(chatData);
      setGitIntegrations(gitData);
      setRepositories(reposData);
    } catch (error) {
      toast.error('Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async () => {
    try {
      await chatIntegrationsApi.create(chatFormData);
      toast.success('Chat integration created');
      setShowChatDialog(false);
      resetChatForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to create integration');
    }
  };

  const handleCreateGit = async () => {
    try {
      await gitIntegrationsApi.create(gitFormData);
      toast.success('Git integration created');
      setShowGitDialog(false);
      resetGitForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to create integration');
    }
  };

  const handleDeleteChat = async (id: string) => {
    if (!confirm('Delete this integration?')) return;
    try {
      await chatIntegrationsApi.delete(id);
      toast.success('Integration deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteGit = async (id: string) => {
    if (!confirm('Delete this integration?')) return;
    try {
      await gitIntegrationsApi.delete(id);
      toast.success('Integration deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleTestChat = async (id: string) => {
    try {
      await chatIntegrationsApi.test(id, 'Test message from Progress Tracker');
      toast.success('Test message sent!');
    } catch (error) {
      toast.error('Test failed');
    }
  };

  const handleSyncRepos = async (id: string) => {
    try {
      const result = await gitIntegrationsApi.syncRepos(id);
      toast.success(`Synced ${result.synced || 0} repositories`);
      fetchData();
    } catch (error) {
      toast.error('Sync failed');
    }
  };

  const resetChatForm = () => {
    setChatFormData({
      platform: 'slack',
      workspace_id: '',
      workspace_name: '',
      notify_task_assigned: true,
      notify_task_completed: true,
      notify_daily_standup: false,
      standup_time: '09:00',
      is_active: true,
    });
  };

  const resetGitForm = () => {
    setGitFormData({
      platform: 'github',
      organization: '',
      sync_issues: true,
      sync_pull_requests: true,
      auto_create_tasks: false,
      auto_update_progress: true,
      is_active: true,
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'slack':
        return <SlackIcon />;
      case 'teams':
        return <TeamsIcon />;
      case 'github':
        return <Github className="h-5 w-5" />;
      case 'gitlab':
        return <GitBranch className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect with Slack, Teams, GitHub, and GitLab
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="chat">
          <TabsList>
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat Integrations
            </TabsTrigger>
            <TabsTrigger value="git">
              <Github className="w-4 h-4 mr-2" />
              Git Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Chat Integration
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Chat Integration</DialogTitle>
                    <DialogDescription>
                      Connect with Slack or Microsoft Teams
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select
                        value={chatFormData.platform}
                        onValueChange={(value) => setChatFormData({ ...chatFormData, platform: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slack">Slack</SelectItem>
                          <SelectItem value="teams">Microsoft Teams</SelectItem>
                          <SelectItem value="discord">Discord</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Workspace ID</Label>
                      <Input
                        value={chatFormData.workspace_id}
                        onChange={(e) => setChatFormData({ ...chatFormData, workspace_id: e.target.value })}
                        placeholder="T01234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Workspace Name</Label>
                      <Input
                        value={chatFormData.workspace_name}
                        onChange={(e) => setChatFormData({ ...chatFormData, workspace_name: e.target.value })}
                        placeholder="My Company"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Notifications</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={chatFormData.notify_task_assigned}
                            onCheckedChange={(checked) => setChatFormData({ ...chatFormData, notify_task_assigned: checked })}
                          />
                          <Label>Task Assigned</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={chatFormData.notify_task_completed}
                            onCheckedChange={(checked) => setChatFormData({ ...chatFormData, notify_task_completed: checked })}
                          />
                          <Label>Task Completed</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={chatFormData.notify_daily_standup}
                            onCheckedChange={(checked) => setChatFormData({ ...chatFormData, notify_daily_standup: checked })}
                          />
                          <Label>Daily Standup</Label>
                        </div>
                      </div>
                    </div>
                    {chatFormData.notify_daily_standup && (
                      <div className="space-y-2">
                        <Label>Standup Time</Label>
                        <Input
                          type="time"
                          value={chatFormData.standup_time}
                          onChange={(e) => setChatFormData({ ...chatFormData, standup_time: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowChatDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateChat}>Add Integration</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {chatIntegrations.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No chat integrations</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect with Slack or Teams to receive notifications
                    </p>
                    <Button onClick={() => setShowChatDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Integration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {chatIntegrations.map((integration) => (
                  <Card key={integration.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getPlatformIcon(integration.platform)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.workspace_name}</CardTitle>
                          <CardDescription>{integration.platform_display || integration.platform}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                          {integration.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleTestChat(integration.id)}>
                          <Play className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteChat(integration.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {integration.notify_task_assigned && <Badge variant="outline">Task Assigned</Badge>}
                        {integration.notify_task_completed && <Badge variant="outline">Task Completed</Badge>}
                        {integration.notify_daily_standup && (
                          <Badge variant="outline">Daily Standup @ {integration.standup_time}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="git" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Dialog open={showGitDialog} onOpenChange={setShowGitDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Git Integration
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Git Integration</DialogTitle>
                    <DialogDescription>
                      Connect with GitHub or GitLab
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select
                        value={gitFormData.platform}
                        onValueChange={(value) => setGitFormData({ ...gitFormData, platform: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="github">GitHub</SelectItem>
                          <SelectItem value="gitlab">GitLab</SelectItem>
                          <SelectItem value="bitbucket">Bitbucket</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Organization (optional)</Label>
                      <Input
                        value={gitFormData.organization}
                        onChange={(e) => setGitFormData({ ...gitFormData, organization: e.target.value })}
                        placeholder="my-organization"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Sync Options</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={gitFormData.sync_issues}
                            onCheckedChange={(checked) => setGitFormData({ ...gitFormData, sync_issues: checked })}
                          />
                          <Label>Sync Issues</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={gitFormData.sync_pull_requests}
                            onCheckedChange={(checked) => setGitFormData({ ...gitFormData, sync_pull_requests: checked })}
                          />
                          <Label>Sync Pull Requests</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={gitFormData.auto_create_tasks}
                            onCheckedChange={(checked) => setGitFormData({ ...gitFormData, auto_create_tasks: checked })}
                          />
                          <Label>Auto-create Tasks from Issues</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={gitFormData.auto_update_progress}
                            onCheckedChange={(checked) => setGitFormData({ ...gitFormData, auto_update_progress: checked })}
                          />
                          <Label>Auto-update Progress from PRs</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowGitDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateGit}>Add Integration</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {gitIntegrations.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Github className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Git integrations</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect with GitHub or GitLab to sync issues and PRs
                    </p>
                    <Button onClick={() => setShowGitDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Integration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {gitIntegrations.map((integration) => (
                  <Card key={integration.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getPlatformIcon(integration.platform)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {integration.organization || integration.platform_display || integration.platform}
                          </CardTitle>
                          <CardDescription>{integration.platform_display || integration.platform}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                          {integration.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleSyncRepos(integration.id)}>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Sync Repos
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteGit(integration.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {integration.sync_issues && <Badge variant="outline">Sync Issues</Badge>}
                        {integration.sync_pull_requests && <Badge variant="outline">Sync PRs</Badge>}
                        {integration.auto_create_tasks && <Badge variant="outline">Auto-create Tasks</Badge>}
                        {integration.auto_update_progress && <Badge variant="outline">Auto-update Progress</Badge>}
                      </div>
                      {repositories.filter(r => r.integration === integration.id).length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Linked Repositories:</p>
                          <div className="space-y-1">
                            {repositories
                              .filter(r => r.integration === integration.id)
                              .map((repo) => (
                                <div key={repo.id} className="flex items-center gap-2 text-sm">
                                  <GitBranch className="w-4 h-4 text-muted-foreground" />
                                  <a 
                                    href={repo.repo_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                  >
                                    {repo.repo_full_name}
                                  </a>
                                  {repo.sync_enabled && (
                                    <Badge variant="secondary" className="text-xs">Synced</Badge>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
