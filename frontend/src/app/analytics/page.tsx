'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';
import { analyticsApi } from '@/src/lib/api-client';
import { useAuth } from '@/src/hooks/use-auth';
import type { AnalyticsDashboard, Report } from '../../types';

interface TimeSummary {
  total_hours: number;
  billable_hours: number;
  entry_count: number;
  by_project: Array<{ task__project__title: string; minutes: number }>;
  by_day: Array<{ date: string; minutes: number }>;
}

export default function AnalyticsPage() {
  const { } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [timeSummary, setTimeSummary] = useState<TimeSummary | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardData, timeData] = await Promise.all([
        analyticsApi.getAnalyticsDashboard(parseInt(period)),
        analyticsApi.getTimeSummary(parseInt(period))
      ]);
      setData(dashboardData);
      setTimeSummary(timeData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [period, fetchData]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track productivity, time, and team performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.tasks.completed_this_period || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.tasks.completed || 0} total completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.time.total_hours || 0}h</div>
            <p className="text-xs text-muted-foreground">
              {data?.time.billable_hours || 0}h billable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.tasks.in_progress || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.tasks.blocked || 0} blocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data?.tasks.overdue || 0}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Completion Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Trend</CardTitle>
                <CardDescription>Tasks completed over time</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.completion_trend && data.completion_trend.length > 0 ? (
                  <div className="space-y-2">
                    {data.completion_trend.map((item, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {new Date(item.week).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-2 bg-green-500 rounded"
                            style={{ width: `${Math.min(item.count * 20, 100)}px` }}
                          />
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Task Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Current state of all tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span>Completed</span>
                    </div>
                    <span className="font-medium">{data?.tasks.completed || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span>In Progress</span>
                    </div>
                    <span className="font-medium">{data?.tasks.in_progress || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span>Blocked</span>
                    </div>
                    <span className="font-medium">{data?.tasks.blocked || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span>Overdue</span>
                    </div>
                    <span className="font-medium">{data?.tasks.overdue || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Time Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Time Summary</CardTitle>
                <CardDescription>Hours logged in selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Hours</span>
                    <span className="text-2xl font-bold">{timeSummary?.total_hours || 0}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Billable Hours</span>
                    <span className="text-xl font-semibold text-green-600">{timeSummary?.billable_hours || 0}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Entries</span>
                    <span>{timeSummary?.entry_count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time by Project */}
            <Card>
              <CardHeader>
                <CardTitle>Time by Project</CardTitle>
                <CardDescription>Distribution across projects</CardDescription>
              </CardHeader>
              <CardContent>
                {timeSummary?.by_project && timeSummary.by_project.length > 0 ? (
                  <div className="space-y-3">
                    {timeSummary.by_project.slice(0, 5).map((item: unknown, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm truncate max-w-[200px]">{(item as {task__project__title: string}).task__project__title}</span>
                        <span className="text-sm font-medium">{Math.round((item as {minutes: number}).minutes / 60)}h</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No time entries</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Time Log</CardTitle>
              <CardDescription>Hours logged per day</CardDescription>
            </CardHeader>
            <CardContent>
              {timeSummary?.by_day && timeSummary.by_day.length > 0 ? (
                <div className="flex items-end gap-1 h-32">
                  {timeSummary.by_day.slice(-14).map((day, index: number) => {
                    const hours = day.minutes / 60;
                    const maxHours = Math.max(...timeSummary.by_day.map((d) => d.minutes / 60));
                    const height = maxHours > 0 ? (hours / maxHours) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-blue-500 rounded-t transition-all"
                          style={{ height: `${height}%`, minHeight: hours > 0 ? '4px' : '0' }}
                          title={`${hours.toFixed(1)}h on ${new Date(day.date).toLocaleDateString()}`}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(day.date).getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No daily data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.projects.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data?.projects.active || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{data?.projects.completed || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportsSection() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await analyticsApi.getReports();
        setReports(data);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleGenerateReport = async (reportId: string) => {
    try {
      await analyticsApi.generateReport(reportId);
      // Refresh or show success
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading reports...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Reports</h3>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Create Report
        </Button>
      </div>

      {reports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{report.name}</CardTitle>
                  <Badge variant="outline">{report.report_type_display}</Badge>
                </div>
                <CardDescription>{report.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Frequency: {report.frequency}</span>
                  {report.last_run && (
                    <span>Last run: {new Date(report.last_run).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleGenerateReport(report.id)}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Generate
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No reports created yet</p>
            <Button className="mt-4">Create Your First Report</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
