"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { analyticsApi } from "@/src/lib/api-client";
import { Report } from "@/src/types";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Download,
  Play,
  Calendar,
  Filter,
  Trash2,
  Clock,
  Share2,
  Copy,
} from "lucide-react";
import { format } from "date-fns";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // New report form state
  const [newReport, setNewReport] = useState({
    name: "",
    description: "",
    report_type: "task_summary",
    filters: {
      date_range: "last_30_days",
      project_id: "",
      status: "",
    },
    schedule: "none",
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await analyticsApi.getReports();
      setReports(data.results || data);
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      const report = await analyticsApi.createReport({
        name: newReport.name,
        description: newReport.description,
        report_type: newReport.report_type,
        filters: newReport.filters,
        schedule: newReport.schedule === "none" ? null : newReport.schedule,
        is_scheduled: newReport.schedule !== "none",
      });
      setReports([report, ...reports]);
      setCreateDialogOpen(false);
      setNewReport({
        name: "",
        description: "",
        report_type: "task_summary",
        filters: { date_range: "last_30_days", project_id: "", status: "" },
        schedule: "none",
      });
      toast.success("Report created successfully");
    } catch (error) {
      toast.error("Failed to create report");
    }
  };

  const handleGenerateReport = async (report: Report) => {
    setSelectedReport(report);
    setGeneratingReport(true);
    try {
      const data = await analyticsApi.generateReport(report.id);
      setReportData(data);
      toast.success("Report generated successfully");
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleExportReport = async (report: Report, format: "pdf" | "csv" | "excel") => {
    try {
      const blob = await analyticsApi.exportReport(report.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.name}.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await analyticsApi.deleteReport(reportId);
      setReports(reports.filter((r) => r.id !== reportId));
      toast.success("Report deleted");
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  const getReportTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      task_summary: { label: "Task Summary", variant: "default" },
      time_report: { label: "Time Report", variant: "secondary" },
      productivity: { label: "Productivity", variant: "outline" },
      progress_report: { label: "Progress", variant: "default" },
      custom: { label: "Custom", variant: "secondary" },
    };
    const config = types[type] || { label: type, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getScheduleBadge = (schedule: string | undefined) => {
    if (!schedule) return null;
    const schedules: Record<string, string> = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    };
    return (
      <Badge variant="outline" className="ml-2">
        <Clock className="h-3 w-3 mr-1" />
        {schedules[schedule] || schedule}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage custom reports for your team
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>
                Configure your custom report with filters and scheduling options.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  placeholder="Monthly Task Summary"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this report contains..."
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={newReport.report_type}
                  onValueChange={(value) => setNewReport({ ...newReport, report_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task_summary">Task Summary</SelectItem>
                    <SelectItem value="time_report">Time Report</SelectItem>
                    <SelectItem value="productivity">Productivity Analysis</SelectItem>
                    <SelectItem value="progress_report">Progress Report</SelectItem>
                    <SelectItem value="custom">Custom Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select
                  value={newReport.filters.date_range}
                  onValueChange={(value) =>
                    setNewReport({
                      ...newReport,
                      filters: { ...newReport.filters, date_range: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                    <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="this_year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Schedule (Optional)</Label>
                <Select
                  value={newReport.schedule}
                  onValueChange={(value) => setNewReport({ ...newReport, schedule: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Schedule</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReport} disabled={!newReport.name}>
                Create Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="recent">Recently Generated</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first report to start tracking team performance
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{report.name}</h3>
                          {getReportTypeBadge(report.report_type)}
                          {getScheduleBadge(report.schedule)}
                        </div>
                        <p className="text-muted-foreground text-sm mb-3">
                          {report.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created {format(new Date(report.created_at), "MMM d, yyyy")}
                          </span>
                          {report.last_generated && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Last generated{" "}
                              {format(new Date(report.last_generated), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateReport(report)}
                          disabled={generatingReport && selectedReport?.id === report.id}
                        >
                          {generatingReport && selectedReport?.id === report.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Generate
                        </Button>

                        <Select
                          onValueChange={(value) =>
                            handleExportReport(report, value as "pdf" | "csv" | "excel")
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          {reports.filter((r) => r.is_scheduled).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No scheduled reports</h3>
                <p className="text-muted-foreground text-center">
                  Schedule reports to receive them automatically
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reports
                .filter((r) => r.is_scheduled)
                .map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{report.name}</h3>
                            {getReportTypeBadge(report.report_type)}
                            {getScheduleBadge(report.schedule)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {report.description}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Edit Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          {reports.filter((r) => r.last_generated).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No generated reports</h3>
                <p className="text-muted-foreground text-center">
                  Generate a report to see it here
                </p>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Generated At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports
                  .filter((r) => r.last_generated)
                  .sort(
                    (a, b) =>
                      new Date(b.last_generated!).getTime() -
                      new Date(a.last_generated!).getTime()
                  )
                  .map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>{getReportTypeBadge(report.report_type)}</TableCell>
                      <TableCell>
                        {format(new Date(report.last_generated!), "MMM d, yyyy 'at' h:mm a")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateReport(report)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Report Preview Dialog */}
      {selectedReport && reportData && (
        <Dialog open={!!reportData} onOpenChange={() => setReportData(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedReport.name} - Preview</DialogTitle>
              <DialogDescription>
                Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(reportData, null, 2)}
              </pre>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportData(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(reportData, null, 2));
                  toast.success("Report data copied to clipboard");
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
