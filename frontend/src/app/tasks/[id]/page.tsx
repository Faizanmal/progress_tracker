"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useRequireAuth } from "@/src/hooks/use-auth";
import { tasksApi, progressApi } from "@/src/lib/api-client";
import type { Task, ProgressUpdate } from "@/src/types";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge, type BadgeProps } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { Separator } from "@/src/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { ArrowLeft, Plus, Clock, AlertCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [progressForm, setProgressForm] = useState({
    description: "",
    status: "in_progress" as string,
    progress_percentage: 0,
    hours_worked: 0,
    blocker_description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useRequireAuth();

  useEffect(() => {
    if (params.id) {
      loadTaskDetails();
    }
  }, [params.id]);

  const loadTaskDetails = async () => {
    try {
      setLoading(true);
      const [taskData, updates] = await Promise.all([
        tasksApi.retrieve(params.id as string),
        progressApi.listByTask(params.id as string),
      ]);
      setTask(taskData);
      setProgressUpdates(updates);
    } catch (error) {
      toast.error("Failed to load task details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProgress = async () => {
    if (!progressForm.description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    try {
      setSubmitting(true);
      await progressApi.create({
        task: params.id as string,
        description: progressForm.description,
        status: progressForm.status as ProgressUpdate['status'],
        progress_percentage: progressForm.progress_percentage,
        hours_worked: progressForm.hours_worked || undefined,
        blocker_description: progressForm.blocker_description || undefined,
      });
      
      toast.success("Progress update submitted successfully");
      setIsProgressDialogOpen(false);
      setProgressForm({
        description: "",
        status: "in_progress",
        progress_percentage: 0,
        hours_worked: 0,
        blocker_description: "",
      });
      loadTaskDetails();
    } catch (error) {
      toast.error("Failed to submit progress update");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await tasksApi.delete(params.id as string);
      toast.success("Task deleted successfully");
      router.push("/tasks");
    } catch (error) {
      toast.error("Failed to delete task");
      console.error(error);
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

  const getPriorityColor = (priority: string): "destructive" | "secondary" | "outline" | "default" => {
    const colors = {
      low: "outline",
      medium: "default",
      high: "destructive",
      urgent: "destructive",
    };
    return (colors[priority as keyof typeof colors] || "default") as "destructive" | "secondary" | "outline" | "default";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">Task not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(task.status)}>
                {task.status.replace("_", " ")}
              </Badge>
              <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
              {task.status === "blocked" && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Blocked
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Progress Update
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Submit Progress Update</DialogTitle>
                  <DialogDescription>
                    Share your progress and update the task status
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="What did you work on?"
                      value={progressForm.description}
                      onChange={(e) =>
                        setProgressForm({ ...progressForm, description: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={progressForm.status}
                        onValueChange={(value: any) =>
                          setProgressForm({ ...progressForm, status: value })
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="progress">Progress Percentage</Label>
                      <Input
                        id="progress"
                        type="number"
                        min="0"
                        max="100"
                        value={progressForm.progress_percentage}
                        onChange={(e) =>
                          setProgressForm({
                            ...progressForm,
                            progress_percentage: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="hours">Hours Worked</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={progressForm.hours_worked}
                      onChange={(e) =>
                        setProgressForm({
                          ...progressForm,
                          hours_worked: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  {progressForm.status === "blocked" && (
                    <div>
                      <Label htmlFor="blocker">Blocker Description</Label>
                      <Textarea
                        id="blocker"
                        placeholder="What is blocking your progress?"
                        value={progressForm.blocker_description}
                        onChange={(e) =>
                          setProgressForm({
                            ...progressForm,
                            blocker_description: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsProgressDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitProgress} disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Update"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {user?.role !== "employee" && (
              <>
                <Button variant="outline" onClick={() => router.push(`/tasks/${task.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDeleteTask}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2">
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="progress">Progress Updates ({progressUpdates.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                </CardContent>
              </Card>

              {task.status === "blocked" && task.blocker_description && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Current Blocker
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-700">{task.blocker_description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="progress" className="space-y-4">
              {progressUpdates.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <p>No progress updates yet</p>
                      <p className="text-sm mt-2">Click &quot;Add Progress Update&quot; to get started</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                progressUpdates.map((update) => (
                  <Card key={update.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {new Date(update.created_at).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </CardTitle>
                          <CardDescription>
                            Updated by {update.submitted_by_name || "Unknown"}
                          </CardDescription>
                        </div>
                        <Badge variant={getStatusColor(update.status)}>
                          {update.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 whitespace-pre-wrap">{update.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {update.progress_percentage !== null && (
                          <div>
                            <span className="text-muted-foreground">Progress: </span>
                            <span className="font-medium">{update.progress_percentage}%</span>
                          </div>
                        )}
                        {update.hours_worked && (
                          <div>
                            <span className="text-muted-foreground">Hours Worked: </span>
                            <span className="font-medium">{update.hours_worked} hrs</span>
                          </div>
                        )}
                      </div>
                      {update.blocker_description && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700">
                            <strong>Blocker:</strong> {update.blocker_description}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Progress</p>
                <div className="flex items-center gap-2">
                  <Progress value={task.progress_percentage} className="flex-1" />
                  <span className="text-sm font-medium">{task.progress_percentage}%</span>
                </div>
              </div>
              <Separator />
              {task.project_name && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Project</p>
                    <p className="font-medium">{task.project_name}</p>
                  </div>
                  <Separator />
                </>
              )}
              {task.assigned_to_name && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Assigned To</p>
                    <p className="font-medium">{task.assigned_to_name}</p>
                  </div>
                  <Separator />
                </>
              )}
              {task.due_date && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <p className="font-medium">
                        {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p className="font-medium">{new Date(task.created_at).toLocaleDateString()}</p>
              </div>
              {task.updated_at !== task.created_at && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                    <p className="font-medium">{new Date(task.updated_at).toLocaleDateString()}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
