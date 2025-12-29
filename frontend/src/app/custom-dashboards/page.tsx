"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import {
  Layout,
  Grid,
  Plus,
  Settings,
  Copy,
  Trash2,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Users,
  Clock,
  Target,
} from "lucide-react";
import { customDashboardsApi } from "@/src/lib/api-client";

interface Dashboard {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
  layout: unknown;
  created_at: string;
  updated_at: string;
}

interface Widget {
  id: string;
  dashboard: string;
  widget_type: string;
  title: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

interface WidgetTemplate {
  id: string;
  name: string;
  widget_type: string;
  description: string;
  default_config: Record<string, unknown>;
  icon: string;
}

interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  preview_image: string;
  category: string;
}

const widgetIcons: Record<string, React.ReactNode> = {
  chart: <BarChart3 className="h-5 w-5" />,
  pie: <PieChart className="h-5 w-5" />,
  line: <LineChart className="h-5 w-5" />,
  stats: <Activity className="h-5 w-5" />,
  team: <Users className="h-5 w-5" />,
  time: <Clock className="h-5 w-5" />,
  progress: <Target className="h-5 w-5" />,
};

export default function CustomDashboardsPage() {
  const [activeTab, setActiveTab] = useState("dashboards");
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [widgetTemplates, setWidgetTemplates] = useState<WidgetTemplate[]>([]);
  const [dashboardTemplates, setDashboardTemplates] = useState<DashboardTemplate[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dashboardsList = await customDashboardsApi.list();
      setDashboards(dashboardsList);

      if (dashboardsList.length > 0 && !selectedDashboard) {
        setSelectedDashboard(dashboardsList[0]);
        const dashboardWidgets = await customDashboardsApi.getWidgets(dashboardsList[0].id);
        setWidgets(dashboardWidgets);
      }

      if (activeTab === "templates") {
        const wTemplates = await customDashboardsApi.getWidgetTemplates();
        setWidgetTemplates(wTemplates);
        const dTemplates = await customDashboardsApi.getDashboardTemplates();
        setDashboardTemplates(dTemplates);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDashboard = async (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    try {
      const dashboardWidgets = await customDashboardsApi.getWidgets(dashboard.id);
      setWidgets(dashboardWidgets);
    } catch (error) {
      console.error("Failed to fetch widgets:", error);
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dashboard?")) return;
    try {
      await customDashboardsApi.delete(id);
      fetchData();
    } catch (error) {
      console.error("Failed to delete dashboard:", error);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    const name = prompt("Enter dashboard name:");
    if (!name) return;
    try {
      await customDashboardsApi.createFromTemplate(templateId, name);
      fetchData();
    } catch (error) {
      console.error("Failed to create dashboard:", error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Custom Dashboards</h1>
          <p className="text-muted-foreground">
            Create and customize your own dashboards
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Dashboard
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboards">
            <Layout className="h-4 w-4 mr-2" />
            My Dashboards
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Grid className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboards" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Dashboard List */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground mb-3">Your Dashboards</h3>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : dashboards.length === 0 ? (
                <Card className="p-4 text-center text-muted-foreground">
                  No dashboards yet. Create one!
                </Card>
              ) : (
                dashboards.map((dashboard) => (
                  <Card
                    key={dashboard.id}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedDashboard?.id === dashboard.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleSelectDashboard(dashboard)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layout className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{dashboard.name}</span>
                      </div>
                      {dashboard.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Dashboard Preview */}
            <div className="lg:col-span-3">
              {selectedDashboard ? (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{selectedDashboard.name}</CardTitle>
                      <CardDescription>{selectedDashboard.description || "No description"}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDashboard(selectedDashboard.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {widgets.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Grid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="mb-4">No widgets yet. Add some widgets to your dashboard!</p>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Widget
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {widgets.map((widget) => (
                          <Card key={widget.id} className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {widgetIcons[widget.widget_type] || <Activity className="h-5 w-5" />}
                              <span className="font-medium text-sm">{widget.title}</span>
                            </div>
                            <div className="h-24 bg-muted rounded flex items-center justify-center text-muted-foreground text-sm">
                              Widget Preview
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="p-12 text-center text-muted-foreground">
                  Select a dashboard to view or edit
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {/* Dashboard Templates */}
          <div>
            <h3 className="text-lg font-medium mb-4">Dashboard Templates</h3>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : dashboardTemplates.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No dashboard templates available.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardTemplates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Layout className="h-12 w-12 text-primary/50" />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                    </CardContent>
                    <div className="p-4 pt-0">
                      <Button
                        className="w-full"
                        onClick={() => handleCreateFromTemplate(template.id)}
                      >
                        Use Template
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Widget Templates */}
          <div>
            <h3 className="text-lg font-medium mb-4">Widget Library</h3>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : widgetTemplates.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No widget templates available.
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {widgetTemplates.map((template) => (
                  <Card key={template.id} className="p-4 text-center hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="h-12 w-12 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
                      {widgetIcons[template.widget_type] || <Activity className="h-6 w-6 text-primary" />}
                    </div>
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
