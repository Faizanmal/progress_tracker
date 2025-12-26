'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog';
import { Label } from '@/src/components/ui/label';
import { Checkbox } from '@/src/components/ui/checkbox';
import { 
  Clock, 
  Play, 
  Square,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  Send
} from 'lucide-react';
import { analyticsApi, tasksApi } from '@/src/lib/api-client';
import { useAuth } from '@/src/hooks/use-auth';
import type { TimeEntry, Timesheet, Task } from '../../types';

export default function TimeTrackingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentTimer, setCurrentTimer] = useState<TimeEntry | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [entriesData, timesheetsData, tasksData] = await Promise.all([
        analyticsApi.getTimeEntries(30),
        analyticsApi.getTimesheets(),
        tasksApi.myTasks()
      ]);
      setTimeEntries(entriesData);
      setTimesheets(timesheetsData);
      setTasks(tasksData);

      // Check for running timer
      try {
        const timer = await analyticsApi.getCurrentTimer();
        setCurrentTimer(timer);
      } catch {
        setCurrentTimer(null);
      }
    } catch (error) {
      console.error('Failed to fetch time tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Timer update effect
  useEffect(() => {
    if (currentTimer?.is_running) {
      const startTime = new Date(currentTimer.start_time).getTime();
      
      const updateElapsed = () => {
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      };
      
      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [currentTimer]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = async (taskId: string, description: string, isBillable: boolean) => {
    try {
      const timer = await analyticsApi.startTimer(taskId, description, isBillable);
      setCurrentTimer(timer);
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handleStopTimer = async () => {
    try {
      await analyticsApi.stopTimer();
      setCurrentTimer(null);
      fetchData();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8 text-blue-500" />
            Time Tracking
          </h1>
          <p className="text-muted-foreground">
            Track time, manage timesheets, and monitor productivity
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Timer */}
      <Card className={currentTimer?.is_running ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Timer</span>
            {currentTimer?.is_running && (
              <Badge variant="default" className="bg-green-500 animate-pulse">
                Running
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentTimer?.is_running ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-5xl font-mono font-bold">{formatDuration(elapsedTime)}</p>
                <p className="text-muted-foreground mt-2">
                  Working on: {currentTimer.task_title}
                </p>
                {currentTimer.description && (
                  <p className="text-sm text-muted-foreground">{currentTimer.description}</p>
                )}
              </div>
              <div className="flex justify-center">
                <Button variant="destructive" size="lg" onClick={handleStopTimer}>
                  <Square className="h-5 w-5 mr-2" />
                  Stop Timer
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">No timer running</p>
              <StartTimerDialog tasks={tasks} onStart={handleStartTimer} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="entries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          <TimeEntriesSection entries={timeEntries} />
        </TabsContent>

        <TabsContent value="timesheets" className="space-y-4">
          <TimesheetsSection 
            timesheets={timesheets} 
            onRefresh={fetchData}
            isManager={user?.role === 'manager' || user?.role === 'admin'}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StartTimerDialog({ tasks, onStart }: { tasks: Task[]; onStart: (taskId: string, description: string, isBillable: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(true);

  const handleStart = () => {
    if (selectedTask) {
      onStart(selectedTask, description, isBillable);
      setOpen(false);
      setSelectedTask('');
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Play className="h-5 w-5 mr-2" />
          Start Timer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Timer</DialogTitle>
          <DialogDescription>Select a task to track time for</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Task</Label>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger>
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                {tasks.filter(t => t.status !== 'completed').map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="billable" 
              checked={isBillable}
              onCheckedChange={(checked) => setIsBillable(checked as boolean)}
            />
            <Label htmlFor="billable">Billable time</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleStart} disabled={!selectedTask}>
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TimeEntriesSection({ entries }: { entries: TimeEntry[] }) {
  const groupedByDate = entries.reduce((acc, entry) => {
    const date = new Date(entry.start_time).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  return (
    <div className="space-y-6">
      {Object.keys(groupedByDate).length > 0 ? (
        (Object.entries(groupedByDate) as [string, TimeEntry[]][]).map(([date, dateEntries]) => {
          const totalMinutes = dateEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
          
          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {date}
                </h3>
                <span className="text-sm text-muted-foreground">
                  Total: {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                </span>
              </div>
              <div className="space-y-2">
                {dateEntries.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{entry.task_title}</p>
                        {entry.description && (
                          <p className="text-sm text-muted-foreground">{entry.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {entry.project_title}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-mono">
                            {Math.floor(entry.duration_minutes / 60)}h {entry.duration_minutes % 60}m
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {entry.end_time && (
                              <> - {new Date(entry.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                            )}
                          </p>
                        </div>
                        <Badge variant={entry.is_billable ? 'default' : 'secondary'}>
                          {entry.is_billable ? 'Billable' : 'Non-billable'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No time entries yet</p>
            <p className="text-sm text-muted-foreground">Start a timer to track your work</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TimesheetsSection({ 
  timesheets, 
  onRefresh,
  isManager 
}: { 
  timesheets: Timesheet[]; 
  onRefresh: () => void;
  isManager: boolean;
}) {
  const handleGenerateTimesheet = async () => {
    try {
      await analyticsApi.generateCurrentWeekTimesheet();
      onRefresh();
    } catch (error) {
      console.error('Failed to generate timesheet:', error);
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      await analyticsApi.submitTimesheet(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to submit timesheet:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await analyticsApi.approveTimesheet(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to approve timesheet:', error);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await analyticsApi.rejectTimesheet(id, reason);
        onRefresh();
      } catch (error) {
        console.error('Failed to reject timesheet:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-500">Submitted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Timesheets</h3>
        <Button onClick={handleGenerateTimesheet}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Current Week
        </Button>
      </div>

      {timesheets.length > 0 ? (
        <div className="space-y-4">
          {timesheets.map((timesheet) => (
            <Card key={timesheet.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Week of {new Date(timesheet.week_start).toLocaleDateString()}
                  </CardTitle>
                  {getStatusBadge(timesheet.status)}
                </div>
                <CardDescription>
                  {timesheet.user_name && `${timesheet.user_name} • `}
                  {new Date(timesheet.week_start).toLocaleDateString()} - {new Date(timesheet.week_end).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <p className="text-2xl font-bold">{timesheet.total_hours}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Billable Hours</p>
                      <p className="text-2xl font-bold text-green-600">{timesheet.billable_hours}h</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {timesheet.status === 'draft' && (
                      <Button size="sm" onClick={() => handleSubmit(timesheet.id)}>
                        <Send className="h-4 w-4 mr-1" />
                        Submit
                      </Button>
                    )}
                    {timesheet.status === 'submitted' && isManager && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(timesheet.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(timesheet.id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {timesheet.rejection_reason && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200">
                    <p className="text-sm text-red-600">
                      <strong>Rejection Reason:</strong> {timesheet.rejection_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No timesheets yet</p>
            <Button className="mt-4" onClick={handleGenerateTimesheet}>
              Generate Current Week Timesheet
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
