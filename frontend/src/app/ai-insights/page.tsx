'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lightbulb,
  BarChart3,
  Target
} from 'lucide-react';
import { aiApi } from '@/src/lib/api-client';
import type { 
  AIInsightsDashboard, 
  TaskPrediction, 
  TaskRecommendation, 
  AnomalyDetection,
  WeeklySummary
} from '../../types';

export default function AIInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AIInsightsDashboard | null>(null);
  const [scanning, setScanning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dashboardData = await aiApi.getAIDashboard();
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      await aiApi.scanForAnomalies();
      await fetchData();
    } catch (error) {
      console.error('Failed to scan:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleGenerateSummary = async () => {
    try {
      await aiApi.generateSummary();
      await fetchData();
    } catch (error) {
      console.error('Failed to generate summary:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            AI Insights
          </h1>
          <p className="text-muted-foreground">
            Smart recommendations, predictions, and anomaly detection
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleScan} disabled={scanning}>
            {scanning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Target className="h-4 w-4 mr-2" />
            )}
            Scan for Issues
          </Button>
          <Button onClick={handleGenerateSummary}>
            <Lightbulb className="h-4 w-4 mr-2" />
            Generate Summary
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data?.predictions.high_risk.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Recommendations</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.recommendations.pending_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Assignment suggestions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.anomalies.unresolved_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.anomalies.by_severity.critical || 0} critical, {data?.anomalies.by_severity.high || 0} high
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Summary</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary ? 'Ready' : 'Not generated'}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.summary?.week_start ? `Week of ${new Date(data.summary.week_start).toLocaleDateString()}` : 'Click generate'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="summary">Weekly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <PredictionsSection predictions={data?.predictions} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <RecommendationsSection onUpdate={fetchData} />
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <AnomaliesSection anomalies={data?.anomalies.recent || []} onUpdate={fetchData} />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <SummarySection summary={data?.summary} onGenerate={handleGenerateSummary} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PredictionsSection({ predictions }: { predictions?: AIInsightsDashboard['predictions'] }) {
  if (!predictions) return null;

  return (
    <div className="space-y-6">
      {/* High Risk Tasks */}
      {predictions.high_risk.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            High Risk Tasks
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {predictions.high_risk.map((prediction: TaskPrediction) => (
              <Card key={prediction.id} className="border-red-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{prediction.task_title}</CardTitle>
                    <Badge variant="destructive">
                      Risk: {Math.round(prediction.risk_score * 100)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Predicted Completion</span>
                      <span>
                        {prediction.predicted_completion_date 
                          ? new Date(prediction.predicted_completion_date).toLocaleDateString()
                          : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Confidence</span>
                      <span>{Math.round(prediction.confidence_score * 100)}%</span>
                    </div>
                    {prediction.risk_factors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-1">Risk Factors:</p>
                        <ul className="text-sm space-y-1">
                          {prediction.risk_factors.map((factor: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Predictions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Predictions</h3>
        {predictions.recent.length > 0 ? (
          <div className="space-y-2">
            {predictions.recent.map((prediction: TaskPrediction) => (
              <Card key={prediction.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{prediction.task_title}</p>
                    <p className="text-sm text-muted-foreground">
                      Generated {new Date(prediction.generated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm">Completion</p>
                      <p className="font-medium">
                        {prediction.predicted_completion_date 
                          ? new Date(prediction.predicted_completion_date).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                    <Badge variant={prediction.risk_score > 0.6 ? 'destructive' : prediction.risk_score > 0.3 ? 'secondary' : 'default'}>
                      {Math.round(prediction.confidence_score * 100)}% conf
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No predictions yet</p>
              <p className="text-sm text-muted-foreground">Predictions are generated automatically for tasks</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function RecommendationsSection({ onUpdate }: { onUpdate: () => void }) {
  const [recommendations, setRecommendations] = useState<TaskRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await aiApi.getRecommendations();
        setRecommendations(data);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handleApply = async (id: string) => {
    try {
      await aiApi.applyRecommendation(id);
      setRecommendations(recommendations.filter(r => r.id !== id));
      onUpdate();
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await aiApi.dismissRecommendation(id);
      setRecommendations(recommendations.filter(r => r.id !== id));
      onUpdate();
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading recommendations...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Task Assignment Recommendations</h3>
      
      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((rec: TaskRecommendation) => (
            <Card key={rec.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{rec.task_title}</CardTitle>
                  <Badge>{rec.recommendation_type_display}</Badge>
                </div>
                <CardDescription>{rec.reason}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Confidence:</span>
                    <Progress value={rec.confidence_score * 100} className="w-24 h-2" />
                    <span className="text-sm">{Math.round(rec.confidence_score * 100)}%</span>
                  </div>
                  
                  {rec.recommended_users_detail && rec.recommended_users_detail.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Recommended:</p>
                      <div className="flex gap-2">
                        {rec.recommended_users_detail.map((user: { id: string; name: string; email: string }) => (
                          <Badge key={user.id} variant="outline">{user.name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApply(rec.id)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Apply
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDismiss(rec.id)}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending recommendations</p>
            <p className="text-sm text-muted-foreground">AI will suggest task assignments as needed</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnomaliesSection({ anomalies, onUpdate }: { anomalies: AnomalyDetection[]; onUpdate: () => void }) {
  const handleResolve = async (id: string) => {
    try {
      await aiApi.resolveAnomaly(id, 'Resolved');
      onUpdate();
    } catch (error) {
      console.error('Failed to resolve anomaly:', error);
    }
  };

  const getSeverityColor = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Detected Anomalies</h3>
      
      {anomalies.length > 0 ? (
        <div className="space-y-4">
          {anomalies.map((anomaly: AnomalyDetection) => (
            <Card key={anomaly.id} className={anomaly.severity === 'critical' ? 'border-red-500' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{anomaly.title}</CardTitle>
                  <Badge variant={getSeverityColor(anomaly.severity)}>
                    {anomaly.severity_display || anomaly.severity}
                  </Badge>
                </div>
                <CardDescription>{anomaly.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Type: {anomaly.anomaly_type_display}</span>
                    {anomaly.user_name && <span>User: {anomaly.user_name}</span>}
                    {anomaly.project_title && <span>Project: {anomaly.project_title}</span>}
                  </div>
                  
                  {anomaly.suggested_actions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Suggested Actions:</p>
                      <ul className="text-sm space-y-1">
                        {anomaly.suggested_actions.map((action: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Button size="sm" onClick={() => handleResolve(anomaly.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Mark Resolved
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-muted-foreground">No anomalies detected</p>
            <p className="text-sm text-muted-foreground">Everything looks good!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummarySection({ summary, onGenerate }: { summary?: WeeklySummary | null; onGenerate: () => void }) {
  if (!summary) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No weekly summary available</p>
          <Button className="mt-4" onClick={onGenerate}>
            Generate Weekly Summary
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
          <CardDescription>
            Week of {new Date(summary.week_start).toLocaleDateString()} - {new Date(summary.week_end).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-6">{summary.summary_text}</p>
          
          <div className="grid gap-6 md:grid-cols-3">
            {/* Highlights */}
            {summary.highlights.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Highlights
                </h4>
                <ul className="space-y-2">
                  {summary.highlights.map((highlight: string, i: number) => (
                    <li key={i} className="text-sm">{highlight}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Concerns */}
            {summary.concerns.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Areas of Concern
                </h4>
                <ul className="space-y-2">
                  {summary.concerns.map((concern: string, i: number) => (
                    <li key={i} className="text-sm">{concern}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Recommendations */}
            {summary.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {summary.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      {summary.metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Week Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{Number(summary.metrics.tasks_completed) || 0}</p>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{Number(summary.metrics.total_hours_logged) || 0}h</p>
                <p className="text-sm text-muted-foreground">Hours Logged</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{Number(summary.metrics.progress_updates_submitted) || 0}</p>
                <p className="text-sm text-muted-foreground">Progress Updates</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{Number(summary.metrics.tasks_blocked) || 0}</p>
                <p className="text-sm text-muted-foreground">Blocked Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
