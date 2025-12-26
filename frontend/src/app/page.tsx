"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/use-auth";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { CheckCircle2, Users, FolderKanban, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Progress Tracker
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Track employee progress, manage tasks, and boost team productivity with our comprehensive
            SaaS solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => router.push("/register")} className="text-lg">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/login")}
              className="text-lg"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <Card>
            <CardHeader>
              <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Task Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create, assign, and track tasks with detailed progress updates and status tracking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FolderKanban className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Project Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Organize tasks into projects and monitor overall progress with team collaboration.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Role-based access control for admins, managers, and employees with proper permissions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Progress Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Real-time analytics and reporting to track team performance and productivity metrics.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Why Choose Progress Tracker?</CardTitle>
            <CardDescription className="text-lg mt-2">
              Everything you need to manage employee progress effectively
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">For Employees</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✓ View assigned tasks and deadlines</li>
                  <li>✓ Submit progress updates easily</li>
                  <li>✓ Track personal productivity</li>
                  <li>✓ Report blockers and get help</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">For Managers</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✓ Monitor team progress in real-time</li>
                  <li>✓ Identify and resolve blockers quickly</li>
                  <li>✓ Generate performance reports</li>
                  <li>✓ Manage projects and assignments</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4">Ready to boost your team&apos;s productivity?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of teams already using Progress Tracker
          </p>
          <Button size="lg" onClick={() => router.push("/register")} className="text-lg">
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
