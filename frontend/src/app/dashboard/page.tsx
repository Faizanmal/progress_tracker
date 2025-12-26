"use client";

import { useAuth, useRequireAuth } from "@/src/hooks/use-auth";
import { EmployeeDashboard } from "@/src/components/dashboard/EmployeeDashboard";
import { ManagerDashboard } from "@/src/components/dashboard/ManagerDashboard";
import { AdminDashboard } from "@/src/components/dashboard/AdminDashboard";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  // Protected route - redirect to login if not authenticated
  useRequireAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null; // useRequireAuth will handle redirect
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your work today.
        </p>
      </div>

      {user.role === "admin" && <AdminDashboard />}
      {user.role === "manager" && <ManagerDashboard />}
      {user.role === "employee" && <EmployeeDashboard />}
    </div>
  );
}

// Old dashboard placeholder removed; this file now renders role-specific dashboards above.
