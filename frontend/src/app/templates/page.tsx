"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import { analyticsApi } from "@/src/lib/api-client";
import { ProjectTemplate, TaskTemplate } from "@/src/types";
import { toast } from "sonner";
import {
  LayoutTemplate,
  Plus,
  Copy,
  Trash2,
  Play,
  Calendar,
  Users,
  FileText,
  Settings2,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

interface TaskTemplateItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  estimated_hours: number;
  order: number;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "general",
    is_public: false,
    default_tasks: [] as TaskTemplateItem[],
    settings: {
      default_duration_days: 30,
      require_approval: false,
      auto_assign_tasks: false,
    },
  });

  // New project from template state
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
  });

  const [taskInput, setTaskInput] = useState({
    title: "",
    description: "",
    priority: "medium",
    estimated_hours: 4,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await analyticsApi.getProjectTemplates();
      setTemplates(data.results || data);
    } catch (error) {
      toast.error("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const template = await analyticsApi.createProjectTemplate({
        name: newTemplate.name,
        description: newTemplate.description,
        category: newTemplate.category,
        default_status: 'planning',
        default_priority: 'medium',
        estimated_duration_days: 30,
        task_templates: newTemplate.default_tasks,
        workflow_stages: ['planning', 'development', 'testing', 'deployment'],
        is_public: newTemplate.is_public,
        settings: newTemplate.settings,
      });
      setTemplates([template, ...templates]);
      setCreateDialogOpen(false);
      resetNewTemplate();
      toast.success("Template created successfully");
    } catch (error) {
      toast.error("Failed to create template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await analyticsApi.deleteProjectTemplate(templateId);
      setTemplates(templates.filter((t) => t.id !== templateId));
      toast.success("Template deleted");
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      await analyticsApi.useProjectTemplate(selectedTemplate.id, {
        project_name: newProject.name,
        project_description: newProject.description,
        start_date: newProject.start_date,
      });
      setUseTemplateDialogOpen(false);
      setNewProject({ name: "", description: "", start_date: format(new Date(), "yyyy-MM-dd") });
      toast.success("Project created from template!");
    } catch (error) {
      toast.error("Failed to create project from template");
    }
  };

  const handleDuplicateTemplate = async (template: ProjectTemplate) => {
    try {
      const duplicated = await analyticsApi.createProjectTemplate({
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        default_status: 'planning',
        default_priority: 'medium',
        estimated_duration_days: 30,
        task_templates: template.default_tasks || [],
        workflow_stages: ['planning', 'development', 'testing', 'deployment'],
        is_public: false,
        settings: template.settings,
      });
      setTemplates([duplicated, ...templates]);
      toast.success("Template duplicated");
    } catch (error) {
      toast.error("Failed to duplicate template");
    }
  };

  const addTaskToTemplate = () => {
    if (!taskInput.title) return;
    const newTask: TaskTemplateItem = {
      id: Date.now().toString(),
      title: taskInput.title,
      description: taskInput.description,
      priority: taskInput.priority,
      estimated_hours: taskInput.estimated_hours,
      order: newTemplate.default_tasks.length + 1,
    };
    setNewTemplate({
      ...newTemplate,
      default_tasks: [...newTemplate.default_tasks, newTask],
    });
    setTaskInput({ title: "", description: "", priority: "medium", estimated_hours: 4 });
  };

  const removeTaskFromTemplate = (taskId: string) => {
    setNewTemplate({
      ...newTemplate,
      default_tasks: newTemplate.default_tasks.filter((t) => t.id !== taskId),
    });
  };

  const resetNewTemplate = () => {
    setNewTemplate({
      name: "",
      description: "",
      category: "general",
      is_public: false,
      default_tasks: [],
      settings: {
        default_duration_days: 30,
        require_approval: false,
        auto_assign_tasks: false,
      },
    });
  };

  const getCategoryBadge = (category: string | undefined) => {
    const categories: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      general: { label: "General", variant: "outline" },
      development: { label: "Development", variant: "default" },
      marketing: { label: "Marketing", variant: "secondary" },
      design: { label: "Design", variant: "secondary" },
      operations: { label: "Operations", variant: "outline" },
    };
    const config = category ? categories[category] || { label: category, variant: "outline" as const } : { label: "Uncategorized", variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorities: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      low: { label: "Low", variant: "outline" },
      medium: { label: "Medium", variant: "secondary" },
      high: { label: "High", variant: "default" },
      urgent: { label: "Urgent", variant: "destructive" },
    };
    const config = priorities[priority] || { label: priority, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Project Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage reusable project templates
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Project Template</DialogTitle>
              <DialogDescription>
                Define a reusable template with default tasks and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="Sprint Template"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe this template..."
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newTemplate.category}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Duration (days)</Label>
                    <Input
                      type="number"
                      value={newTemplate.settings.default_duration_days}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          settings: {
                            ...newTemplate.settings,
                            default_duration_days: parseInt(e.target.value) || 30,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Make Public</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow other team members to use this template
                    </p>
                  </div>
                  <Switch
                    checked={newTemplate.is_public}
                    onCheckedChange={(checked) =>
                      setNewTemplate({ ...newTemplate, is_public: checked })
                    }
                  />
                </div>
              </div>

              {/* Default Tasks */}
              <div className="space-y-4">
                <Label>Default Tasks</Label>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Task title"
                      value={taskInput.title}
                      onChange={(e) => setTaskInput({ ...taskInput, title: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Select
                        value={taskInput.priority}
                        onValueChange={(value) => setTaskInput({ ...taskInput, priority: value })}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="w-20"
                        placeholder="Hours"
                        value={taskInput.estimated_hours}
                        onChange={(e) =>
                          setTaskInput({ ...taskInput, estimated_hours: parseInt(e.target.value) || 0 })
                        }
                      />
                      <Button type="button" onClick={addTaskToTemplate} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {newTemplate.default_tasks.length > 0 && (
                    <div className="space-y-2">
                      {newTemplate.default_tasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{index + 1}.</span>
                            <span className="font-medium">{task.title}</span>
                            {getPriorityBadge(task.priority)}
                            <span className="text-sm text-muted-foreground">
                              {task.estimated_hours}h
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTaskFromTemplate(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <Label>Settings</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Require Approval</p>
                      <p className="text-sm text-muted-foreground">
                        Tasks need manager approval before completion
                      </p>
                    </div>
                    <Switch
                      checked={newTemplate.settings.require_approval}
                      onCheckedChange={(checked) =>
                        setNewTemplate({
                          ...newTemplate,
                          settings: { ...newTemplate.settings, require_approval: checked },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-assign Tasks</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically assign tasks based on team roles
                      </p>
                    </div>
                    <Switch
                      checked={newTemplate.settings.auto_assign_tasks}
                      onCheckedChange={(checked) =>
                        setNewTemplate({
                          ...newTemplate,
                          settings: { ...newTemplate.settings, auto_assign_tasks: checked },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={!newTemplate.name}>
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutTemplate className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first template to streamline project creation
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">{template.description}</CardDescription>
                  </div>
                  {getCategoryBadge(template.category)}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{template.default_tasks?.length || 0} default tasks</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{template.settings?.default_duration_days || 30} days duration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{template.is_public ? "Public" : "Private"}</span>
                  </div>
                  {template.usage_count !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Used {template.usage_count} times</span>
                    </div>
                  )}
                </div>

                {template.default_tasks && template.default_tasks.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Included Tasks:</p>
                    <div className="space-y-1">
                      {template.default_tasks.slice(0, 3).map((task: TaskTemplate, index: number) => (
                        <div
                          key={index}
                          className="flex items-center text-sm text-muted-foreground"
                        >
                          <ChevronRight className="h-3 w-3 mr-1" />
                          {task.title}
                        </div>
                      ))}
                      {template.default_tasks.length > 3 && (
                        <p className="text-sm text-muted-foreground">
                          +{template.default_tasks.length - 3} more tasks
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setUseTemplateDialogOpen(true);
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDuplicateTemplate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Use Template Dialog */}
      <Dialog open={useTemplateDialogOpen} onOpenChange={setUseTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project from Template</DialogTitle>
            <DialogDescription>
              {selectedTemplate && (
                <>
                  Using template: <strong>{selectedTemplate.name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="My New Project"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description (Optional)</Label>
              <Textarea
                id="project-description"
                placeholder="Project description..."
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={newProject.start_date}
                onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
              />
            </div>

            {selectedTemplate && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">This will create:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 1 new project</li>
                  <li>• {selectedTemplate.default_tasks?.length || 0} tasks</li>
                  <li>
                    • End date:{" "}
                    {format(
                      new Date(
                        new Date(newProject.start_date).getTime() +
                          (selectedTemplate.settings?.default_duration_days || 30) *
                            24 *
                            60 *
                            60 *
                            1000
                      ),
                      "MMMM d, yyyy"
                    )}
                  </li>
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUseTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUseTemplate} disabled={!newProject.name}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
