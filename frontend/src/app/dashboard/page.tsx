"use client";

import { useAuth, useRequireAuth } from "@/src/hooks/use-auth";
import { EmployeeDashboard } from "@/src/components/dashboard/EmployeeDashboard";
import { ManagerDashboard } from "@/src/components/dashboard/ManagerDashboard";
import { AdminDashboard } from "@/src/components/dashboard/AdminDashboard";
import { PageLoader } from "@/src/components/ui/loading";
import { PageHeader, PageContainer } from "@/src/components/layout/AppShell";
import { MotionDiv } from "@/src/lib/motion";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  // Protected route - redirect to login if not authenticated
  useRequireAuth();

  if (isLoading) {
    return <PageLoader message="Loading your dashboard..." />;
  }

  if (!user) {
    return null; // useRequireAuth will handle redirect
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <PageContainer>
      <MotionDiv
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          {getGreeting()}, {user.name.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your work today.
        </p>
      </MotionDiv>

      {user.role === "admin" && <AdminDashboard />}
      {user.role === "manager" && <ManagerDashboard />}
      {user.role === "employee" && <EmployeeDashboard />}
    </PageContainer>
  );
}
