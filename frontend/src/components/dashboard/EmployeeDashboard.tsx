"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge, type BadgeProps } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { Separator } from "@/src/components/ui/separator";
import { tasksApi, progressApi } from "@/src/lib/api-client";
import type { Task, ProgressUpdate } from "@/src/types";
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function EmployeeDashboard() {
  const router = useRouter();
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<ProgressUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tasks, updates] = await Promise.all([
        tasksApi.myTasks(),
        progressApi.myUpdates(),
      ]);

      setMyTasks(tasks);
      setRecentUpdates(updates.slice(0, 5)); // Show latest 5 updates

      // Calculate stats
      const stats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.status === "completed").length,
        inProgressTasks: tasks.filter((t) => t.status === "in_progress").length,
        overdueTasks: tasks.filter(
          (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed"
        ).length,
      };
      setStats(stats);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): "destructive" | "secondary" | "outline" | "default" => {
    const colors = {
      todo: "default",
      in_progress: "default",
      completed: "default",
      blocked: "destructive",
    };
    return (colors[status as keyof typeof colors] || "default") as "destructive" | "secondary" | "outline" | "default";
  };

  const getPriorityColor = (priority: string): "destructive" | "secondary" | "outline" | "default" | null | undefined => {
    const colors = {
      low: "default",
      medium: "default",
      high: "destructive",
      urgent: "destructive",
    };
    return (colors[priority as keyof typeof colors] || "default") as "destructive" | "secondary" | "outline" | "default" | null | undefined;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTasks > 0
                ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%`
                : "0%"}{" "}
              completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.overdueTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* My Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Tasks assigned to you</CardDescription>
            </div>
            <Button onClick={() => router.push("/tasks")}>View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          {myTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks assigned yet
            </div>
          ) : (
            <div className="space-y-4">
              {myTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => router.push(`/tasks/${task.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge variant={getStatusColor(task.status)}>
                        {task.status.replace("_", " ")}
                      </Badge>
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <Progress value={task.progress_percentage} className="w-24" />
                        <span className="text-sm text-muted-foreground">
                          {task.progress_percentage}%
                        </span>
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Progress Updates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Progress Updates</CardTitle>
              <CardDescription>Your latest progress submissions</CardDescription>
            </div>
            <Button onClick={() => router.push("/progress")}>View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentUpdates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No progress updates yet
            </div>
          ) : (
            <div className="space-y-4">
              {recentUpdates.map((update) => (
                <div key={update.id} className="border-l-2 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {update.task_title || `Task #${update.task}`}
                    </span>
                    <Badge>{update.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{update.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{new Date(update.created_at).toLocaleDateString()}</span>
                    {update.hours_worked && (
                      <span>{update.hours_worked} hours worked</span>
                    )}
                    {update.progress_percentage && (
                      <span>{update.progress_percentage}% complete</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
