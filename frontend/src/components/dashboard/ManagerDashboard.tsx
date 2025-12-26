"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { tasksApi, projectsApi, usersApi } from "@/src/lib/api-client";
import type { Task, Project, User, TeamProgressSummary } from "@/src/types";
import { AlertCircle, TrendingUp, Users, FolderKanban, Clock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ManagerDashboard() {
  const router = useRouter();
  const [blockedTasks, setBlockedTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [teamProgress, setTeamProgress] = useState<TeamProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [blocked, overdue, projectsList, users, progress] = await Promise.all([
        tasksApi.blocked(),
        tasksApi.overdue(),
        projectsApi.list(),
        usersApi.listTeamMembers(),
        usersApi.getTeamProgress(),
      ]);

      setBlockedTasks(blocked.slice(0, 5));
      setOverdueTasks(overdue.slice(0, 5));
      setProjects(projectsList);
      setTeamMembers(users);
      setTeamProgress(progress);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{blockedTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{overdueTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Progress Summary */}
      {teamProgress && (
        <Card>
          <CardHeader>
            <CardTitle>Team Progress Summary</CardTitle>
            <CardDescription>Overall team performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium mb-2">Tasks Completion</p>
                <div className="flex items-center gap-2">
                  <Progress
                    value={
                      teamProgress.total_tasks > 0
                        ? (teamProgress.completed_tasks / teamProgress.total_tasks) * 100
                        : 0
                    }
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">
                    {teamProgress.completed_tasks}/{teamProgress.total_tasks}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Active Team Members</p>
                <div className="text-2xl font-bold">{teamProgress.active_members}</div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Avg Progress This Week</p>
                <div className="text-2xl font-bold">
                  {teamProgress.average_progress_percentage?.toFixed(1) || 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blocked Tasks Alert */}
      {blockedTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-red-700">Blocked Tasks - Needs Attention</CardTitle>
                <CardDescription>Tasks that require immediate action</CardDescription>
              </div>
              <Button variant="destructive" onClick={() => router.push("/tasks?status=blocked")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blockedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/tasks/${task.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge variant="destructive">Blocked</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Assigned to: {task.assigned_to_name || "Unassigned"}
                    </p>
                    {task.blocker_description && (
                      <p className="text-sm text-red-600 mt-1">
                        Blocker: {task.blocker_description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Projects Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Projects you manage</CardDescription>
              </div>
              <Button onClick={() => router.push("/projects")}>View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No projects yet</div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{project.name}</h4>
                      <Badge>{project.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {project.team_members_details?.slice(0, 3).map((member) => (
                          <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={member.profile_picture || ""} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {(project.team_members_details?.length || 0) > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs">
                              +{(project.team_members_details?.length || 0) - 3}
                            </span>
                          </div>
                        )}
                      </div>
                      {project.end_date && (
                        <span className="text-xs text-muted-foreground">
                          Due: {new Date(project.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Your team overview</CardDescription>
              </div>
              <Button onClick={() => router.push("/team")}>View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No team members yet</div>
            ) : (
              <div className="space-y-4">
                {teamMembers.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => router.push(`/team/${member.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profile_picture || ""} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-orange-700">Overdue Tasks</CardTitle>
                <CardDescription>Tasks past their due date</CardDescription>
              </div>
              <Button variant="outline" onClick={() => router.push("/tasks?status=overdue")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => router.push(`/tasks/${task.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <h4 className="font-medium">{task.title}</h4>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Assigned to: {task.assigned_to_name || "Unassigned"}</span>
                      <span className="text-orange-600">
                        Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
