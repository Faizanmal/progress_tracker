"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import {
  Flag,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Target,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import apiClient from "@/src/lib/api";

interface Milestone {
  id: string;
  title: string;
  description: string;
  project: { id: string; name: string };
  due_date: string;
  status: string;
  progress: number;
  tasks_count: number;
  completed_tasks_count: number;
  created_at: string;
}

interface BurndownData {
  dates: string[];
  ideal: number[];
  actual: number[];
  remaining_tasks: number;
  total_tasks: number;
  velocity: number;
}

interface ProjectDependency {
  id: string;
  from_task: { id: string; title: string };
  to_task: { id: string; title: string };
  dependency_type: string;
  lag_days: number;
}

export default function MilestonesPage() {
  const [activeTab, setActiveTab] = useState("milestones");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [dependencies, setDependencies] = useState<ProjectDependency[]>([]);
  const [burndownData, setBurndownData] = useState<BurndownData | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
    fetchData();
  }, [activeTab, selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await apiClient.get("/projects/");
      setProjects(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "milestones":
          const params = selectedProject ? { project: selectedProject } : {};
          const milestonesResponse = await apiClient.get("/analytics/milestones/", { params });
          setMilestones(milestonesResponse.data.results || milestonesResponse.data);
          break;
        case "burndown":
          if (selectedProject) {
            const burndownResponse = await apiClient.get(`/analytics/burndown/${selectedProject}/`);
            setBurndownData(burndownResponse.data);
          }
          break;
        case "dependencies":
          const depsParams = selectedProject ? { project: selectedProject } : {};
          const depsResponse = await apiClient.get("/analytics/dependencies/", { params: depsParams });
          setDependencies(depsResponse.data.results || depsResponse.data);
          break;
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "default";
      case "at_risk": return "destructive";
      case "overdue": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-blue-500" />;
      case "at_risk": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "overdue": return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Flag className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDependencyTypeLabel = (type: string) => {
    switch (type) {
      case "finish_to_start": return "Finish → Start";
      case "start_to_start": return "Start → Start";
      case "finish_to_finish": return "Finish → Finish";
      case "start_to_finish": return "Start → Finish";
      default: return type;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Milestones & Dependencies</h1>
          <p className="text-muted-foreground">
            Track project milestones, burndown charts, and task dependencies
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Milestone
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Milestones</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{milestones.length}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {milestones.filter(m => m.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">Milestones completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {milestones.filter(m => m.status === "at_risk").length}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {milestones.filter(m => m.status === "overdue").length}
            </div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="milestones">
            <Flag className="h-4 w-4 mr-2" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="burndown">
            <TrendingUp className="h-4 w-4 mr-2" />
            Burndown Chart
          </TabsTrigger>
          <TabsTrigger value="dependencies">
            <Target className="h-4 w-4 mr-2" />
            Dependencies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Milestones</CardTitle>
              <CardDescription>Track key project deliverables and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : milestones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No milestones found. Create your first milestone.
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(milestone.status)}
                          <div>
                            <p className="font-medium">{milestone.title}</p>
                            <p className="text-sm text-muted-foreground">{milestone.description}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(milestone.status) as "default" | "secondary" | "destructive"}>
                          {milestone.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="outline">{milestone.project?.name || "Unknown Project"}</Badge>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {new Date(milestone.due_date).toLocaleDateString()}</span>
                        </div>
                        <span>
                          {milestone.completed_tasks_count}/{milestone.tasks_count} tasks
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="burndown" className="space-y-4">
          {!selectedProject ? (
            <Card className="p-8 text-center text-muted-foreground">
              Select a project to view its burndown chart
            </Card>
          ) : loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : burndownData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Burndown Chart</CardTitle>
                    <CardDescription>Track remaining work over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/20">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                        <p>Burndown chart visualization</p>
                        <p className="text-sm">
                          {burndownData.remaining_tasks} of {burndownData.total_tasks} tasks remaining
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Sprint Metrics</CardTitle>
                  <CardDescription>Current sprint performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Velocity</p>
                    <p className="text-2xl font-bold">{burndownData.velocity} tasks/day</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Remaining Tasks</p>
                    <p className="text-2xl font-bold">{burndownData.remaining_tasks}</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold">
                      {burndownData.total_tasks > 0
                        ? Math.round(((burndownData.total_tasks - burndownData.remaining_tasks) / burndownData.total_tasks) * 100)
                        : 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              No burndown data available for this project
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Task Dependencies</CardTitle>
                <CardDescription>View and manage task relationships</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Dependency
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : dependencies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No dependencies defined. Add dependencies to track task relationships.
                </div>
              ) : (
                <div className="space-y-3">
                  {dependencies.map((dep) => (
                    <div key={dep.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{dep.from_task?.title || "Unknown Task"}</p>
                          <p className="text-xs text-muted-foreground">Predecessor</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <Badge variant="outline">{getDependencyTypeLabel(dep.dependency_type)}</Badge>
                          {dep.lag_days !== 0 && (
                            <span className="text-xs text-muted-foreground">
                              {dep.lag_days > 0 ? `+${dep.lag_days}` : dep.lag_days} days
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{dep.to_task?.title || "Unknown Task"}</p>
                          <p className="text-xs text-muted-foreground">Successor</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
