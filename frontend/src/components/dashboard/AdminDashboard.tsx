"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { StatCard, StatCardGrid } from "@/src/components/ui/stat-card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { PageLoader, SkeletonCard } from "@/src/components/ui/loading";
import { MotionDiv, StaggerContainer, StaggerItem, FadeUp } from "@/src/lib/motion";
import { companyApi, usersApi, projectsApi, tasksApi } from "@/src/lib/api-client";
import type { Company, User, Project, DashboardData } from "@/src/types";
import {
  Users,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  Building2,
  Crown,
  UserCog,
  UserCheck,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AdminDashboard() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [companyData, dashboard, usersList, projectsList] = await Promise.all([
        companyApi.getCompany(),
        companyApi.getDashboard(),
        usersApi.list(),
        projectsApi.list(),
      ]);

      setCompany(companyData);
      setDashboardData(dashboard);
      setUsers(usersList);
      setProjects(projectsList);
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4" />;
      case "manager":
        return <UserCog className="h-4 w-4" />;
      case "employee":
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "manager":
        return "default";
      case "employee":
        return "outline";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Company Info Card */}
      {company && (
        <FadeUp>
          <Card variant="glass" className="overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-violet-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white shadow-lg shadow-primary/20">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{company.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="premium" dot>
                        {company.subscription_plan}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={() => router.push("/settings/company")} className="gap-2">
                  Manage Company
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        </FadeUp>
      )}

      {/* Stats Cards */}
      <StaggerContainer>
        <StatCardGrid>
          <StaggerItem>
            <StatCard
              title="Total Users"
              value={dashboardData?.total_users || 0}
              subtitle={`${users.filter((u) => u.is_active).length} active`}
              icon={Users}
              color="primary"
              trend={{ value: 12, label: "vs last month" }}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Total Projects"
              value={dashboardData?.total_projects || 0}
              subtitle={`${projects.filter((p) => p.status === "active").length} active`}
              icon={FolderKanban}
              color="success"
              trend={{ value: 8, label: "vs last month" }}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Total Tasks"
              value={dashboardData?.total_tasks || 0}
              subtitle={`${dashboardData?.completed_tasks || 0} completed`}
              icon={CheckSquare}
              color="info"
              trend={{ value: 24, label: "vs last month" }}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Progress Updates"
              value={dashboardData?.total_progress_updates || 0}
              subtitle="This month"
              icon={TrendingUp}
              color="warning"
              trend={{ value: 18, label: "vs last month" }}
            />
          </StaggerItem>
        </StatCardGrid>
      </StaggerContainer>

      {/* Role Distribution */}
      <FadeUp delay={0.2}>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              User Distribution by Role
            </CardTitle>
            <CardDescription>Overview of user roles in your company</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <MotionDiv
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between p-5 border rounded-xl bg-gradient-to-br from-primary/5 to-transparent hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Admins</p>
                    <p className="text-3xl font-bold">
                      {users.filter((u) => u.role === "admin").length}
                    </p>
                  </div>
                </div>
              </MotionDiv>
              <MotionDiv
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between p-5 border rounded-xl bg-gradient-to-br from-info/5 to-transparent hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-info/10 rounded-xl">
                    <UserCog className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Managers</p>
                    <p className="text-3xl font-bold">
                      {users.filter((u) => u.role === "manager").length}
                    </p>
                  </div>
                </div>
              </MotionDiv>
              <MotionDiv
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between p-5 border rounded-xl bg-gradient-to-br from-success/5 to-transparent hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-success/10 rounded-xl">
                    <UserCheck className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employees</p>
                    <p className="text-3xl font-bold">
                      {users.filter((u) => u.role === "employee").length}
                    </p>
                  </div>
                </div>
              </MotionDiv>
            </div>
          </CardContent>
        </Card>
      </FadeUp>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <FadeUp delay={0.3}>
          <Card variant="elevated" className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Latest registered users</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push("/settings/users")} className="gap-1">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <EmptyState
                  title="No users yet"
                  description="Add users to your company to get started"
                  action={{
                    label: "Add User",
                    onClick: () => router.push("/settings/users/new"),
                  }}
                  size="sm"
                />
              ) : (
                <div className="space-y-3">
                  {users.slice(0, 5).map((user, index) => (
                    <MotionDiv
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 border rounded-xl hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/settings/users/${user.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage src={user.profile_picture || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role === "admin" ? "default" : user.role === "manager" ? "info" : "secondary"}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {user.role}
                          </span>
                        </Badge>
                        {!user.is_active && (
                          <Badge variant="destructive" size="sm">Inactive</Badge>
                        )}
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeUp>

        {/* Recent Projects */}
        <FadeUp delay={0.4}>
          <Card variant="elevated" className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Latest created projects</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push("/projects")} className="gap-1">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <EmptyState
                  title="No projects yet"
                  description="Create your first project to get started"
                  action={{
                    label: "Create Project",
                    onClick: () => router.push("/projects/new"),
                  }}
                  size="sm"
                />
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project, index) => (
                    <MotionDiv
                      key={project.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="p-4 border rounded-xl hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{project.name}</h4>
                        <Badge 
                          variant={project.status === "active" ? "success" : project.status === "completed" ? "default" : "secondary"}
                          dot
                        >
                          {project.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {project.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <UserCog className="h-3 w-3" />
                          {project.manager_name || "Unassigned"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {project.team_members_details?.length || 0} members
                        </span>
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeUp>
      </div>

      {/* Quick Actions */}
      <FadeUp delay={0.5}>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Users, label: "Add User", href: "/settings/users/new", color: "primary" },
                { icon: FolderKanban, label: "Create Project", href: "/projects/new", color: "success" },
                { icon: Building2, label: "Company Settings", href: "/settings/company", color: "info" },
                { icon: TrendingUp, label: "View Reports", href: "/reports", color: "warning" },
              ].map((action, index) => (
                <MotionDiv
                  key={action.href}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className="h-auto w-full py-6 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5"
                    onClick={() => router.push(action.href)}
                  >
                    <div className={`p-3 rounded-xl bg-${action.color}/10`}>
                      <action.icon className="h-6 w-6" style={{ color: `hsl(var(--${action.color}))` }} />
                    </div>
                    <span className="font-medium">{action.label}</span>
                  </Button>
                </MotionDiv>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeUp>
    </div>
  );
}
