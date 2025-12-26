'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Progress } from '@/src/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { 
  Users, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowRight,
  AlertTriangle,
  Loader2,
  UserCheck,
  UserMinus,
  UserPlus,
  Zap
} from 'lucide-react';
import { resourceAllocationApi } from '@/src/lib/api-client';
import type { ResourceAllocationSuggestion } from '@/src/types';
import { toast } from 'sonner';

interface WorkloadAnalysis {
  overloaded: { user_id: string; user_name: string; workload_score: number; active_tasks: number }[];
  underloaded: { user_id: string; user_name: string; workload_score: number; active_tasks: number }[];
  balanced: { user_id: string; user_name: string; workload_score: number; active_tasks: number }[];
}

export default function ResourcesPage() {
  const [suggestions, setSuggestions] = useState<ResourceAllocationSuggestion[]>([]);
  const [workloadAnalysis, setWorkloadAnalysis] = useState<WorkloadAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [suggestionsData, analysisData] = await Promise.all([
        resourceAllocationApi.getSuggestions().catch(() => []),
        resourceAllocationApi.getWorkloadAnalysis().catch(() => null),
      ]);
      setSuggestions(suggestionsData.filter((s: ResourceAllocationSuggestion) => !s.is_applied && !s.is_dismissed));
      setWorkloadAnalysis(analysisData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id: string) => {
    try {
      await resourceAllocationApi.applySuggestion(id);
      toast.success('Suggestion applied');
      fetchData();
    } catch (error) {
      toast.error('Failed to apply suggestion');
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await resourceAllocationApi.dismissSuggestion(id);
      toast.success('Suggestion dismissed');
      fetchData();
    } catch (error) {
      toast.error('Failed to dismiss');
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'reassign':
        return <ArrowRight className="w-5 h-5" />;
      case 'redistribute':
        return <RefreshCw className="w-5 h-5" />;
      case 'overload':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'skill_gap':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'hire':
        return <Users className="w-5 h-5 text-green-500" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getSuggestionBadge = (type: string) => {
    switch (type) {
      case 'reassign':
        return <Badge className="bg-purple-500">Reassign</Badge>;
      case 'redistribute':
        return <Badge className="bg-blue-500">Redistribute</Badge>;
      case 'overload':
        return <Badge className="bg-orange-500">Overload</Badge>;
      case 'skill_gap':
        return <Badge className="bg-cyan-500">Skill Gap</Badge>;
      case 'hire':
        return <Badge className="bg-green-500">Hire</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getWorkloadColor = (score: number) => {
    if (score > 80) return 'text-red-500';
    if (score > 60) return 'text-orange-500';
    if (score > 40) return 'text-green-500';
    return 'text-blue-500';
  };

  const getWorkloadProgressColor = (score: number) => {
    if (score > 80) return 'bg-red-500';
    if (score > 60) return 'bg-orange-500';
    if (score > 40) return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Allocation</h1>
          <p className="text-muted-foreground">
            AI-powered workload balancing and task assignment suggestions
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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
          {/* Workload Overview */}
          {workloadAnalysis && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overloaded</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {workloadAnalysis.overloaded.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Team members with high workload
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Balanced</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {workloadAnalysis.balanced.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Team members with optimal workload
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available</CardTitle>
                  <UserCheck className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">
                    {workloadAnalysis.underloaded.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Team members with capacity
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="suggestions">
            <TabsList>
              <TabsTrigger value="suggestions">
                AI Suggestions
                {suggestions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{suggestions.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="workload">Team Workload</TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="space-y-4 mt-4">
              {suggestions.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-medium">Workload is balanced</h3>
                      <p className="text-muted-foreground">
                        No resource allocation suggestions at this time
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <Card key={suggestion.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              {getSuggestionIcon(suggestion.suggestion_type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                {getSuggestionBadge(suggestion.suggestion_type)}
                                {suggestion.task_title && (
                                  <span className="font-medium">{suggestion.task_title}</span>
                                )}
                              </div>
                              <CardDescription>{suggestion.reason}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Impact: {Math.round(suggestion.impact_score * 100)}%
                            </Badge>
                            <Badge variant="secondary">
                              Confidence: {Math.round(suggestion.confidence_score * 100)}%
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Reassignment visualization */}
                        {suggestion.suggestion_type === 'reassign' && (
                          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg mb-4">
                            <div className="flex items-center gap-2">
                              <UserMinus className="w-4 h-4 text-red-500" />
                              <span className="font-medium">{suggestion.from_user_name}</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                              <UserPlus className="w-4 h-4 text-green-500" />
                              <span className="font-medium">{suggestion.to_user_name}</span>
                            </div>
                          </div>
                        )}

                        {/* Supporting data */}
                        {suggestion.supporting_data && Object.keys(suggestion.supporting_data).length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {Object.entries(suggestion.supporting_data).map(([key, value]) => (
                              <div key={key} className="text-center p-2 bg-muted/50 rounded">
                                <p className="text-lg font-semibold">{String(value)}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {key.replace(/_/g, ' ')}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => handleDismiss(suggestion.id)}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                          <Button onClick={() => handleApply(suggestion.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Apply
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="workload" className="space-y-4 mt-4">
              {workloadAnalysis ? (
                <div className="space-y-6">
                  {/* Overloaded */}
                  {workloadAnalysis.overloaded.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          <CardTitle className="text-red-500">Overloaded Team Members</CardTitle>
                        </div>
                        <CardDescription>
                          These team members have too many tasks assigned
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {workloadAnalysis.overloaded.map((member) => (
                            <div key={member.user_id} className="flex items-center gap-4">
                              <div className="w-40 font-medium truncate">{member.user_name}</div>
                              <div className="flex-1">
                                <Progress 
                                  value={member.workload_score} 
                                  className="h-3"
                                />
                              </div>
                              <div className={`w-16 text-right font-bold ${getWorkloadColor(member.workload_score)}`}>
                                {Math.round(member.workload_score)}%
                              </div>
                              <Badge variant="secondary">{member.active_tasks} tasks</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Balanced */}
                  {workloadAnalysis.balanced.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <CardTitle className="text-green-500">Balanced Team Members</CardTitle>
                        </div>
                        <CardDescription>
                          These team members have an optimal workload
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {workloadAnalysis.balanced.map((member) => (
                            <div key={member.user_id} className="flex items-center gap-4">
                              <div className="w-40 font-medium truncate">{member.user_name}</div>
                              <div className="flex-1">
                                <Progress 
                                  value={member.workload_score} 
                                  className="h-3"
                                />
                              </div>
                              <div className={`w-16 text-right font-bold ${getWorkloadColor(member.workload_score)}`}>
                                {Math.round(member.workload_score)}%
                              </div>
                              <Badge variant="secondary">{member.active_tasks} tasks</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Underloaded */}
                  {workloadAnalysis.underloaded.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-blue-500" />
                          <CardTitle className="text-blue-500">Available Team Members</CardTitle>
                        </div>
                        <CardDescription>
                          These team members have capacity for more work
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {workloadAnalysis.underloaded.map((member) => (
                            <div key={member.user_id} className="flex items-center gap-4">
                              <div className="w-40 font-medium truncate">{member.user_name}</div>
                              <div className="flex-1">
                                <Progress 
                                  value={member.workload_score} 
                                  className="h-3"
                                />
                              </div>
                              <div className={`w-16 text-right font-bold ${getWorkloadColor(member.workload_score)}`}>
                                {Math.round(member.workload_score)}%
                              </div>
                              <Badge variant="secondary">{member.active_tasks} tasks</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No workload data</h3>
                      <p className="text-muted-foreground">
                        Workload analysis data is not available
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
