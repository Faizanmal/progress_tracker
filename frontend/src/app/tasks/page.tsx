"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useRequireAuth } from "@/src/hooks/use-auth";
import { tasksApi } from "@/src/lib/api-client";
import type { Task } from "@/src/types";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge, type BadgeProps } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Progress } from "@/src/components/ui/progress";
import { Plus, Search, Filter, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function TasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useRequireAuth();

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = user?.role === "employee" 
        ? await tasksApi.myTasks() 
        : await tasksApi.list();
      setTasks(data);
    } catch (error) {
      toast.error("Failed to load tasks");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
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

  const getPriorityColor = (priority: string): "destructive" | "secondary" | "outline" | "default" => {
    const colors = {
      low: "outline",
      medium: "default",
      high: "destructive",
      urgent: "destructive",
    };
    return (colors[priority as keyof typeof colors] || "default") as "destructive" | "secondary" | "outline" | "default";
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === "employee" 
              ? "Manage your assigned tasks" 
              : "Manage all tasks in your organization"}
          </p>
        </div>
        {user?.role !== "employee" && (
          <Button onClick={() => router.push("/tasks/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPriorityFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">No tasks found</p>
              <p className="text-sm mt-2">
                {tasks.length === 0 
                  ? "Get started by creating your first task" 
                  : "Try adjusting your filters"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/tasks/${task.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      <Badge variant={getStatusColor(task.status)}>
                        {task.status.replace("_", " ")}
                      </Badge>
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      {task.status === "blocked" && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Blocked
                        </Badge>
                      )}
                      {task.due_date && isOverdue(task.due_date) && task.status !== "completed" && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-4 line-clamp-2">{task.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Progress:</span>
                        <Progress value={task.progress_percentage} className="w-32" />
                        <span className="font-medium">{task.progress_percentage}%</span>
                      </div>
                      
                      {task.project_name && (
                        <div>
                          <span className="text-muted-foreground">Project: </span>
                          <span className="font-medium">{task.project_name}</span>
                        </div>
                      )}
                      
                      {task.assigned_to_name && (
                        <div>
                          <span className="text-muted-foreground">Assigned to: </span>
                          <span className="font-medium">{task.assigned_to_name}</span>
                        </div>
                      )}
                      
                      {task.due_date && (
                        <div>
                          <span className="text-muted-foreground">Due: </span>
                          <span className="font-medium">
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {task.status === "blocked" && task.blocker_description && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700">
                          <strong>Blocker:</strong> {task.blocker_description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
