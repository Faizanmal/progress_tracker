"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Calendar,
  BarChart3,
  Plus,
  RefreshCw,
} from "lucide-react";
import { resourcesApi } from "@/src/lib/api-client";

interface Allocation {
  id: string;
  user: { id: string; name: string; email: string };
  project: { id: string; name: string };
  allocation_percentage: number;
  start_date: string;
  end_date: string | null;
  status: string;
}

interface Capacity {
  id: string;
  user: { id: string; name: string };
  weekly_hours: number;
  available_hours: number;
  utilization_rate: number;
}

interface CapacityWarning {
  id: string;
  user: { id: string; name: string };
  warning_type: string;
  severity: string;
  message: string;
  status: string;
  created_at: string;
}

interface Budget {
  id: string;
  project: { id: string; name: string };
  total_budget: number;
  spent_amount: number;
  remaining_amount: number;
  currency: string;
  status: string;
}

interface Expense {
  id: string;
  budget: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_by: { name: string };
}

interface BudgetAlert {
  id: string;
  budget: { project: { name: string } };
  alert_type: string;
  threshold_percentage: number;
  current_percentage: number;
  message: string;
  status: string;
  created_at: string;
}

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState("allocations");
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [capacities, setCapacities] = useState<Capacity[]>([]);
  const [warnings, setWarnings] = useState<CapacityWarning[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "allocations":
          const allocs = await resourcesApi.getAllocations();
          setAllocations(allocs);
          break;
        case "capacity":
          const caps = await resourcesApi.getCapacity();
          setCapacities(caps);
          const warns = await resourcesApi.getCapacityWarnings();
          setWarnings(warns);
          break;
        case "budgets":
          const budgs = await resourcesApi.getBudgets();
          setBudgets(budgs);
          const alerts = await resourcesApi.getBudgetAlerts();
          setBudgetAlerts(alerts);
          break;
        case "expenses":
          const exps = await resourcesApi.getExpenses();
          setExpenses(exps);
          break;
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAcknowledgeWarning = async (id: string) => {
    try {
      await resourcesApi.acknowledgeWarning(id);
      fetchData();
    } catch (error) {
      console.error("Failed to acknowledge warning:", error);
    }
  };

  const handleAcknowledgeBudgetAlert = async (id: string) => {
    try {
      await resourcesApi.acknowledgeBudgetAlert(id);
      fetchData();
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resource Management</h1>
          <p className="text-muted-foreground">
            Manage team allocations, capacity, and budgets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Allocation
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allocations.length}</div>
            <p className="text-xs text-muted-foreground">Active team assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warnings.filter(w => w.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${budgets.reduce((sum, b) => sum + b.total_budget, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Alerts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetAlerts.filter(a => a.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Active alerts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="allocations">
            <Users className="h-4 w-4 mr-2" />
            Allocations
          </TabsTrigger>
          <TabsTrigger value="capacity">
            <BarChart3 className="h-4 w-4 mr-2" />
            Capacity
          </TabsTrigger>
          <TabsTrigger value="budgets">
            <DollarSign className="h-4 w-4 mr-2" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <Calendar className="h-4 w-4 mr-2" />
            Expenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Allocations</CardTitle>
              <CardDescription>View and manage team member project assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : allocations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No allocations found. Create your first allocation.
                </div>
              ) : (
                <div className="space-y-4">
                  {allocations.map((allocation) => (
                    <div key={allocation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{allocation.user?.name || "Unknown User"}</p>
                          <p className="text-sm text-muted-foreground">{allocation.project?.name || "Unknown Project"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{allocation.allocation_percentage}%</p>
                          <p className="text-xs text-muted-foreground">
                            {allocation.start_date} - {allocation.end_date || "Ongoing"}
                          </p>
                        </div>
                        <Badge variant={allocation.status === "active" ? "default" : "secondary"}>
                          {allocation.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Capacity</CardTitle>
                <CardDescription>Current utilization rates</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : capacities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No capacity data available.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {capacities.map((capacity) => (
                      <div key={capacity.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{capacity.user?.name || "Unknown"}</span>
                          <span>{capacity.utilization_rate}%</span>
                        </div>
                        <Progress value={capacity.utilization_rate} />
                        <p className="text-xs text-muted-foreground">
                          {capacity.available_hours}h available of {capacity.weekly_hours}h/week
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Capacity Warnings</CardTitle>
                <CardDescription>Issues requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : warnings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No warnings. Team capacity is healthy!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {warnings.map((warning) => (
                      <div key={warning.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={getSeverityColor(warning.severity) as "default" | "secondary" | "destructive" | "outline"}>
                            {warning.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(warning.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{warning.message}</p>
                        {warning.status === "active" && (
                          <Button size="sm" variant="outline" onClick={() => handleAcknowledgeWarning(warning.id)}>
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Project Budgets</CardTitle>
                  <CardDescription>Budget allocation and spending</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : budgets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No budgets found. Create a budget for your projects.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {budgets.map((budget) => {
                        const spentPercentage = (budget.spent_amount / budget.total_budget) * 100;
                        return (
                          <div key={budget.id} className="p-4 border rounded-lg space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{budget.project?.name || "Unknown Project"}</p>
                                <p className="text-sm text-muted-foreground">
                                  {budget.currency} {budget.spent_amount.toLocaleString()} of {budget.total_budget.toLocaleString()}
                                </p>
                              </div>
                              <Badge variant={budget.status === "active" ? "default" : "secondary"}>
                                {budget.status}
                              </Badge>
                            </div>
                            <Progress value={spentPercentage} />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{spentPercentage.toFixed(1)}% spent</span>
                              <span>{budget.currency} {budget.remaining_amount.toLocaleString()} remaining</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Budget Alerts</CardTitle>
                <CardDescription>Threshold notifications</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : budgetAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No budget alerts.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {budgetAlerts.map((alert) => (
                      <div key={alert.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={alert.current_percentage >= 90 ? "destructive" : "default"}>
                            {alert.current_percentage.toFixed(0)}%
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{alert.budget?.project?.name}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                        {alert.status === "active" && (
                          <Button size="sm" variant="outline" onClick={() => handleAcknowledgeBudgetAlert(alert.id)}>
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>Track project expenses</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No expenses recorded. Add your first expense.
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{expense.category}</Badge>
                          <span>{new Date(expense.date).toLocaleDateString()}</span>
                          <span>by {expense.created_by?.name || "Unknown"}</span>
                        </div>
                      </div>
                      <p className="font-medium">${expense.amount.toLocaleString()}</p>
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
