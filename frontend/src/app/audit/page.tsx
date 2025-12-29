"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  User,
  RefreshCw,
  History,
  GitCompare,
  Bookmark,
  Plus,
  Trash2,
} from "lucide-react";
import { auditApi } from "@/src/lib/api-client";

interface AuditLog {
  id: string;
  user: { id: string; name: string; email: string } | null;
  action: string;
  model_type: string;
  object_id: string;
  object_repr: string;
  changes: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

interface Snapshot {
  id: string;
  model_type: string;
  object_id: string;
  object_repr: string;
  data: Record<string, unknown>;
  created_by: { name: string } | null;
  created_at: string;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  created_at: string;
}

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  view: "bg-gray-100 text-gray-800",
};

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState("logs");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Filters
  const [actionFilter, setActionFilter] = useState<string>("");
  const [modelFilter, setModelFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [activeTab, actionFilter, modelFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "logs":
          const params: Record<string, string> = {};
          if (actionFilter) params.action = actionFilter;
          if (modelFilter) params.model_type = modelFilter;
          const logsData = await auditApi.getLogs(params);
          setLogs(logsData);
          break;
        case "snapshots":
          const snapshotsData = await auditApi.getSnapshots();
          setSnapshots(snapshotsData);
          break;
        case "saved":
          const searchesData = await auditApi.getSavedSearches();
          setSavedSearches(searchesData);
          break;
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    if (!confirm("Delete this saved search?")) return;
    try {
      await auditApi.deleteSavedSearch(id);
      fetchData();
    } catch (error) {
      console.error("Failed to delete saved search:", error);
    }
  };

  const handleRunSavedSearch = async (id: string) => {
    try {
      const results = await auditApi.runSavedSearch(id);
      setLogs(results);
      setActiveTab("logs");
    } catch (error) {
      console.error("Failed to run saved search:", error);
    }
  };

  const formatChanges = (changes: Record<string, unknown>) => {
    if (!changes || Object.keys(changes).length === 0) return null;
    
    return Object.entries(changes).map(([field, value]) => {
      const change = value as { old?: unknown; new?: unknown };
      return (
        <div key={field} className="text-xs">
          <span className="font-medium">{field}:</span>{" "}
          <span className="text-red-500 line-through">{String(change.old ?? "")}</span>
          {" → "}
          <span className="text-green-500">{String(change.new ?? "")}</span>
        </div>
      );
    });
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.object_repr.toLowerCase().includes(query) ||
      log.user?.name.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground">
            Track all changes and actions in the system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="snapshots">
            <History className="h-4 w-4 mr-2" />
            Snapshots
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Bookmark className="h-4 w-4 mr-2" />
            Saved Searches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="view">View</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={modelFilter} onValueChange={setModelFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Models</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Showing {filteredLogs.length} entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs found.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedLog?.id === log.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${actionColors[log.action] || actionColors.view}`}>
                            {log.action.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{log.object_repr}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{log.user?.name || "System"}</span>
                              <Clock className="h-3 w-3 ml-2" />
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">{log.model_type}</Badge>
                      </div>
                      
                      {selectedLog?.id === log.id && log.changes && (
                        <div className="mt-3 pt-3 border-t space-y-1">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Changes:</p>
                          {formatChanges(log.changes)}
                          {log.ip_address && (
                            <p className="text-xs text-muted-foreground mt-2">
                              IP: {log.ip_address}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snapshots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Snapshots</CardTitle>
              <CardDescription>Point-in-time snapshots of data for comparison</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : snapshots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No snapshots available.
                </div>
              ) : (
                <div className="space-y-3">
                  {snapshots.map((snapshot) => (
                    <div key={snapshot.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{snapshot.object_repr}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline">{snapshot.model_type}</Badge>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>{new Date(snapshot.created_at).toLocaleString()}</span>
                            {snapshot.created_by && (
                              <>
                                <User className="h-3 w-3 ml-2" />
                                <span>{snapshot.created_by.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <GitCompare className="h-4 w-4 mr-2" />
                            Compare
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Saved Searches</CardTitle>
                <CardDescription>Quick access to common audit queries</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Save Current Search
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : savedSearches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No saved searches. Save a search to quickly access it later.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedSearches.map((search) => (
                    <div key={search.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">{search.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(search.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleRunSavedSearch(search.id)}>
                          <Search className="h-4 w-4 mr-2" />
                          Run
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSavedSearch(search.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
