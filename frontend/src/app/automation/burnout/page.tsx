'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Progress } from '@/src/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Clock,
  Coffee,
  Calendar,
  Activity,
  Heart,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { burnoutApi } from '@/src/lib/api-client';
import type { BurnoutIndicator, WorkloadSnapshot } from '@/src/types';
import { toast } from 'sonner';

export default function BurnoutPage() {
  const [myIndicator, setMyIndicator] = useState<BurnoutIndicator | null>(null);
  const [teamIndicators, setTeamIndicators] = useState<BurnoutIndicator[]>([]);
  const [snapshots, setSnapshots] = useState<WorkloadSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [myData, snapshotData] = await Promise.all([
        burnoutApi.getMyIndicator().catch(() => null),
        burnoutApi.getMySnapshots(30).catch(() => []),
      ]);
      setMyIndicator(myData);
      setSnapshots(snapshotData);

      // Try to fetch team data (will fail if not manager)
      try {
        const teamData = await burnoutApi.getTeamIndicators();
        setTeamIndicators(teamData);
        setIsManager(true);
      } catch {
        setIsManager(false);
      }
    } catch (error) {
      toast.error('Failed to fetch burnout data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddress = async (id: string) => {
    const notes = prompt('Notes on how you addressed this:');
    if (!notes) return;
    try {
      await burnoutApi.addressIndicator(id, notes);
      toast.success('Indicator addressed');
      fetchData();
    } catch (error) {
      toast.error('Failed to address indicator');
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-500 bg-red-100 dark:bg-red-900';
      case 'high':
        return 'text-orange-500 bg-orange-100 dark:bg-orange-900';
      case 'moderate':
        return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900';
      case 'low':
        return 'text-green-500 bg-green-100 dark:bg-green-900';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">Critical Risk</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High Risk</Badge>;
      case 'moderate':
        return <Badge className="bg-yellow-500">Moderate Risk</Badge>;
      case 'low':
        return <Badge className="bg-green-500">Low Risk</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const avgHoursLast7Days = snapshots.length > 0
    ? snapshots.slice(0, 7).reduce((sum, s) => sum + s.hours_worked, 0) / Math.min(snapshots.length, 7)
    : 0;

  const avgOvertimeLast7Days = snapshots.length > 0
    ? snapshots.slice(0, 7).reduce((sum, s) => sum + s.overtime_hours, 0) / Math.min(snapshots.length, 7)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Burnout Detection</h1>
          <p className="text-muted-foreground">
            AI-powered workload analysis and wellbeing monitoring
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Risk Alert */}
          {myIndicator && (myIndicator.risk_level === 'high' || myIndicator.risk_level === 'critical') && !myIndicator.is_addressed && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Burnout Risk Detected</AlertTitle>
              <AlertDescription>
                Your current workload patterns indicate a {myIndicator.risk_level} risk of burnout. 
                Please review the recommendations below and consider discussing with your manager.
              </AlertDescription>
            </Alert>
          )}

          {/* My Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
                <Brain className={`h-4 w-4 ${myIndicator ? getRiskColor(myIndicator.risk_level).split(' ')[0] : 'text-gray-400'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myIndicator ? `${Math.round(myIndicator.risk_score * 100)}%` : 'N/A'}
                </div>
                {myIndicator && (
                  <Progress 
                    value={myIndicator.risk_score * 100} 
                    className="mt-2"
                  />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Hours/Day</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgHoursLast7Days.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overtime</CardTitle>
                {avgOvertimeLast7Days > 1 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgOvertimeLast7Days.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">Avg daily overtime</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myIndicator?.tasks_overdue || 0}</div>
                <p className="text-xs text-muted-foreground">Currently overdue</p>
              </CardContent>
            </Card>
          </div>

          {/* My Indicator Details */}
          {myIndicator && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getRiskColor(myIndicator.risk_level)}`}>
                      <Heart className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Your Wellbeing Assessment</CardTitle>
                      <CardDescription>Based on your work patterns over the past weeks</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRiskBadge(myIndicator.risk_level)}
                    {myIndicator.is_addressed ? (
                      <Badge variant="outline" className="bg-green-50">
                        <CheckCircle className="w-3 h-3 mr-1" />Addressed
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleAddress(myIndicator.id)}>
                        Mark as Addressed
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{myIndicator.avg_hours_per_week.toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">Avg hours/week</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{myIndicator.consecutive_overtime_weeks}</p>
                    <p className="text-xs text-muted-foreground">Overtime weeks</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <Coffee className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{myIndicator.no_break_days}</p>
                    <p className="text-xs text-muted-foreground">Days without break</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{myIndicator.meeting_hours.toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">Meeting hours</p>
                  </div>
                </div>

                {myIndicator.recommendations && myIndicator.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Recommendations</h4>
                    <div className="space-y-3">
                      {myIndicator.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className={`p-1 rounded ${
                            rec.priority === 'critical' ? 'bg-red-100' :
                            rec.priority === 'high' ? 'bg-orange-100' :
                            rec.priority === 'medium' ? 'bg-yellow-100' :
                            'bg-green-100'
                          }`}>
                            <Activity className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{rec.title}</p>
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                            <Badge variant="outline" className="mt-1">{rec.category}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Team Overview (Managers Only) */}
          {isManager && teamIndicators.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <CardTitle>Team Burnout Risk Overview</CardTitle>
                </div>
                <CardDescription>
                  Monitor your team&apos;s wellbeing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamIndicators
                    .sort((a, b) => b.risk_score - a.risk_score)
                    .map((indicator) => (
                      <div key={indicator.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${getRiskColor(indicator.risk_level)}`}>
                            <Brain className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{indicator.user_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{indicator.avg_hours_per_week.toFixed(1)}h/week</span>
                              <span>•</span>
                              <span>{indicator.tasks_overdue} overdue</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-semibold">{Math.round(indicator.risk_score * 100)}%</p>
                            <Progress value={indicator.risk_score * 100} className="w-24" />
                          </div>
                          {getRiskBadge(indicator.risk_level)}
                          {indicator.is_addressed && (
                            <Badge variant="outline" className="bg-green-50">
                              <CheckCircle className="w-3 h-3 mr-1" />Addressed
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workload History */}
          {snapshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Workload History</CardTitle>
                <CardDescription>Your daily work patterns over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-1">
                    {snapshots.slice(0, 28).reverse().map((snapshot, index) => {
                      const intensity = Math.min(snapshot.hours_worked / 12, 1);
                      const isOvertime = snapshot.overtime_hours > 0;
                      return (
                        <div
                          key={snapshot.id || index}
                          className={`h-8 rounded ${
                            isOvertime 
                              ? 'bg-red-200 dark:bg-red-800' 
                              : `bg-green-${Math.round(intensity * 5) * 100 || 100} dark:bg-green-${900 - Math.round(intensity * 5) * 100}`
                          }`}
                          title={`${new Date(snapshot.date).toLocaleDateString()}: ${snapshot.hours_worked.toFixed(1)}h worked`}
                          style={{
                            backgroundColor: isOvertime 
                              ? `rgba(239, 68, 68, ${0.3 + intensity * 0.7})` 
                              : `rgba(34, 197, 94, ${0.2 + intensity * 0.6})`
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>4 weeks ago</span>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.5)' }} />
                      Normal hours
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.5)' }} />
                      Overtime
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
