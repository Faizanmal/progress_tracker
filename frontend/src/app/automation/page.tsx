'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Badge } from '@/src/components/ui/badge';
import { 
  Workflow, 
  Zap, 
  GitBranch, 
  AlertTriangle, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  Brain,
  Mic,
  MapPin,
  Users,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function AutomationPage() {
  const [stats, setStats] = useState({
    activeWorkflows: 0,
    pendingEscalations: 0,
    bottlenecks: 0,
    burnoutAlerts: 0,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Hub</h1>
          <p className="text-muted-foreground">
            Manage workflows, integrations, and intelligent automations
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">Automating your work</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Escalations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingEscalations}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bottlenecks</CardTitle>
            <GitBranch className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bottlenecks}</div>
            <p className="text-xs text-muted-foreground">Blocking tasks detected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Burnout Alerts</CardTitle>
            <Brain className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.burnoutAlerts}</div>
            <p className="text-xs text-muted-foreground">Team wellbeing flags</p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Workflow Automation */}
        <Link href="/automation/workflows">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Workflow className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <CardTitle className="text-lg">Workflow Automation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create custom automation rules triggered by task events. Auto-assign, notify, 
                update statuses, and integrate with external services.
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">Triggers</Badge>
                <Badge variant="secondary">Conditions</Badge>
                <Badge variant="secondary">Actions</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Task Dependencies */}
        <Link href="/automation/dependencies">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <GitBranch className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <CardTitle className="text-lg">Task Dependencies</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Visualize and manage task dependencies. Identify bottlenecks and automatically 
                adjust timelines when delays occur.
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">Dependency Graph</Badge>
                <Badge variant="secondary">Auto-Adjust</Badge>
                <Badge variant="secondary">Bottleneck Detection</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Escalation System */}
        <Link href="/automation/escalations">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                </div>
                <CardTitle className="text-lg">Escalation System</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Set up automated escalation rules for overdue or blocked tasks. 
                Route issues to the right people automatically.
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">Rules</Badge>
                <Badge variant="secondary">Notifications</Badge>
                <Badge variant="secondary">Auto-Reassign</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Calendar & Scheduling */}
        <Link href="/automation/calendar">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <CardTitle className="text-lg">Calendar & Scheduling</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Smart calendar integration with AI-powered scheduling suggestions. 
                Sync with Google Calendar and Outlook.
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">Sync</Badge>
                <Badge variant="secondary">Smart Scheduling</Badge>
                <Badge variant="secondary">Conflict Avoidance</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Integrations */}
        <Link href="/automation/integrations">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900">
                  <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                </div>
                <CardTitle className="text-lg">Integrations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect with Slack, Microsoft Teams, GitHub, and GitLab. 
                Sync issues, PRs, and get notifications where you work.
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">Slack</Badge>
                <Badge variant="secondary">Teams</Badge>
                <Badge variant="secondary">GitHub</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Burnout Detection */}
        <Link href="/automation/burnout">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                  <Brain className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <CardTitle className="text-lg">Burnout Detection</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI-powered burnout risk analysis. Monitor workload patterns, 
                overtime trends, and get proactive recommendations.
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">Risk Analysis</Badge>
                <Badge variant="secondary">Workload Tracking</Badge>
                <Badge variant="secondary">Recommendations</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Resource Allocation */}
        <Link href="/automation/resources">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900">
                  <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                </div>
                <CardTitle className="text-lg">Resource Allocation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Predictive resource allocation with AI suggestions. Balance 
                workloads and find the best assignee for each task.
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">AI Suggestions</Badge>
                <Badge variant="secondary">Workload Balance</Badge>
                <Badge variant="secondary">Skill Matching</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Dashboard Builder */}
        <Link href="/automation/dashboards">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <BarChart3 className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
                </div>
                <CardTitle className="text-lg">Personalized Dashboards</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create custom dashboards with drag-and-drop widgets. 
                Visualize the metrics that matter most to you.
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">Custom Widgets</Badge>
                <Badge variant="secondary">Drag & Drop</Badge>
                <Badge variant="secondary">Auto-Refresh</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Voice Commands */}
        <Link href="/automation/voice">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900">
                  <Mic className="h-5 w-5 text-pink-600 dark:text-pink-300" />
                </div>
                <CardTitle className="text-lg">Voice Commands</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Control tasks with your voice. Create tasks, log updates, 
                and check status hands-free.
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">Speech Recognition</Badge>
                <Badge variant="secondary">Quick Actions</Badge>
                <Badge variant="secondary">Status Updates</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
