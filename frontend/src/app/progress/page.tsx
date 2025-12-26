"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/src/hooks/use-auth";
import { progressApi } from "@/src/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { ProgressUpdate } from "@/src/types";

export default function ProgressPage() {
  const { user } = useAuth();
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgressUpdates = async () => {
      try {
        const updates = await progressApi.myUpdates();
        setProgressUpdates(updates);
      } catch (error) {
        console.error("Failed to fetch progress updates:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProgressUpdates();
    }
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'at_risk':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-100 text-green-800';
      case 'at_risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Progress</h1>
        <p className="text-muted-foreground">
          Track your task progress and updates
        </p>
      </div>

      {progressUpdates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Progress Updates Yet</h3>
            <p className="text-muted-foreground text-center">
              Start working on tasks to see your progress updates here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {progressUpdates.map((update) => (
            <Card key={update.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{update.task_title || `Task ${update.task}`}</CardTitle>
                    <CardDescription>
                      Updated {new Date(update.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(update.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(update.status)}
                      {update.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{update.progress_percentage}%</span>
                    </div>
                    <Progress value={update.progress_percentage} className="h-2" />
                  </div>

                  {update.description && (
                    <p className="text-sm text-muted-foreground">
                      {update.description}
                    </p>
                  )}

                  {update.blockers && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm font-medium text-red-800 mb-1">Blockers:</p>
                      <p className="text-sm text-red-700">{update.blockers}</p>
                    </div>
                  )}

                  {update.next_steps && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm font-medium text-blue-800 mb-1">Next Steps:</p>
                      <p className="text-sm text-blue-700">{update.next_steps}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}