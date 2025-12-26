"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Textarea } from "@/src/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { analyticsApi } from "@/src/lib/api-client";
import { Timesheet } from "@/src/types";
import { useAuth } from "@/src/hooks/use-auth";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO } from "date-fns";

export default function TimesheetsPage() {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  useEffect(() => {
    fetchTimesheets();
  }, [currentWeek]);

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const params = {
        week_start: format(weekStart, "yyyy-MM-dd"),
        week_end: format(weekEnd, "yyyy-MM-dd"),
      };
      const data = await analyticsApi.getTimesheets(params);
      setTimesheets(data.results || data);
    } catch (error) {
      toast.error("Failed to fetch timesheets");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTimesheet = async (timesheetId: string) => {
    setSubmitting(true);
    try {
      await analyticsApi.submitTimesheet(timesheetId);
      await fetchTimesheets();
      toast.success("Timesheet submitted for approval");
    } catch (error) {
      toast.error("Failed to submit timesheet");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveTimesheet = async () => {
    if (!selectedTimesheet) return;
    setSubmitting(true);
    try {
      await analyticsApi.approveTimesheet(selectedTimesheet.id, reviewNotes);
      await fetchTimesheets();
      setReviewDialogOpen(false);
      setReviewNotes("");
      toast.success("Timesheet approved");
    } catch (error) {
      toast.error("Failed to approve timesheet");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectTimesheet = async () => {
    if (!selectedTimesheet || !reviewNotes) {
      toast.error("Please provide rejection notes");
      return;
    }
    setSubmitting(true);
    try {
      await analyticsApi.rejectTimesheet(selectedTimesheet.id, reviewNotes);
      await fetchTimesheets();
      setReviewDialogOpen(false);
      setReviewNotes("");
      toast.success("Timesheet rejected");
    } catch (error) {
      toast.error("Failed to reject timesheet");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      draft: { label: "Draft", variant: "outline" },
      submitted: { label: "Pending Approval", variant: "secondary" },
      approved: { label: "Approved", variant: "default" },
      rejected: { label: "Rejected", variant: "destructive" },
    };
    const config = statuses[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const isManager = user?.role === "admin" || user?.role === "manager";

  // Filter timesheets based on role
  const myTimesheets = timesheets.filter((t) => t.user === user?.id);
  const teamTimesheets = timesheets.filter((t) => t.user !== user?.id);

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
          <h1 className="text-3xl font-bold">Timesheets</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage weekly time entries
          </p>
        </div>
      </div>

      {/* Week Navigation */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <h2 className="text-lg font-semibold">
                {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
              </h2>
              <p className="text-sm text-muted-foreground">
                Week of {format(weekStart, "yyyy")}
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              disabled={weekStart >= startOfWeek(new Date(), { weekStartsOn: 1 })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="my-timesheets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-timesheets">My Timesheets</TabsTrigger>
          {isManager && <TabsTrigger value="team">Team Timesheets</TabsTrigger>}
          {isManager && <TabsTrigger value="pending">Pending Approval</TabsTrigger>}
        </TabsList>

        <TabsContent value="my-timesheets" className="space-y-4">
          {myTimesheets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No timesheet for this week</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start tracking time to create a timesheet
                </p>
                <Button onClick={() => (window.location.href = "/time-tracking")}>
                  <Clock className="h-4 w-4 mr-2" />
                  Go to Time Tracking
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myTimesheets.map((timesheet) => (
                <Card key={timesheet.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Week of {format(parseISO(timesheet.week_start), "MMMM d, yyyy")}
                        </CardTitle>
                        <CardDescription>
                          {format(parseISO(timesheet.week_start), "MMM d")} -{" "}
                          {format(parseISO(timesheet.week_end), "MMM d, yyyy")}
                        </CardDescription>
                      </div>
                      {getStatusBadge(timesheet.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">
                          {formatDuration(timesheet.total_hours * 60)}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Time</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{timesheet.entries_count || 0}</p>
                        <p className="text-sm text-muted-foreground">Entries</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">
                          {Math.round((timesheet.total_hours / 40) * 100)}%
                        </p>
                        <p className="text-sm text-muted-foreground">of 40h</p>
                      </div>
                    </div>

                    {timesheet.notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Notes:</p>
                        <p className="text-sm text-muted-foreground">{timesheet.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      {timesheet.status === "draft" && (
                        <Button
                          onClick={() => handleSubmitTimesheet(timesheet.id)}
                          disabled={submitting}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Submit for Approval
                        </Button>
                      )}
                      {timesheet.status === "rejected" && (
                        <Button
                          variant="outline"
                          onClick={() => (window.location.href = "/time-tracking")}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Edit Time Entries
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {isManager && (
          <>
            <TabsContent value="team" className="space-y-4">
              {teamTimesheets.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No team timesheets</h3>
                    <p className="text-muted-foreground text-center">
                      Your team members haven&apos;t submitted timesheets for this week
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Week</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Entries</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamTimesheets.map((timesheet) => (
                      <TableRow key={timesheet.id}>
                        <TableCell className="font-medium">
                          {timesheet.user_name || `User ${timesheet.user}`}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(timesheet.week_start), "MMM d")} -{" "}
                          {format(parseISO(timesheet.week_end), "MMM d")}
                        </TableCell>
                        <TableCell>{formatDuration(timesheet.total_hours * 60)}</TableCell>
                        <TableCell>{timesheet.entries_count || 0}</TableCell>
                        <TableCell>{getStatusBadge(timesheet.status)}</TableCell>
                        <TableCell>
                          {timesheet.status === "submitted" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTimesheet(timesheet);
                                setReviewDialogOpen(true);
                              }}
                            >
                              Review
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {teamTimesheets.filter((t) => t.status === "submitted").length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground text-center">
                      No timesheets pending your approval
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {teamTimesheets
                    .filter((t) => t.status === "submitted")
                    .map((timesheet) => (
                      <Card key={timesheet.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">
                                {timesheet.user_name || `User ${timesheet.user}`}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(timesheet.week_start), "MMMM d")} -{" "}
                                {format(parseISO(timesheet.week_end), "MMMM d, yyyy")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">
                                {formatDuration(timesheet.total_hours * 60)}
                              </p>
                              <p className="text-sm text-muted-foreground">Total Time</p>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedTimesheet(timesheet);
                                setReviewDialogOpen(true);
                              }}
                            >
                              Review & Approve
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Timesheet</DialogTitle>
            <DialogDescription>
              {selectedTimesheet && (
                <>
                  {selectedTimesheet.user_name || `User ${selectedTimesheet.user}`} -{" "}
                  {format(parseISO(selectedTimesheet.week_start), "MMM d")} to{" "}
                  {format(parseISO(selectedTimesheet.week_end), "MMM d, yyyy")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedTimesheet && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {formatDuration(selectedTimesheet.total_hours * 60)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedTimesheet.entries_count || 0}</p>
                  <p className="text-sm text-muted-foreground">Entries</p>
                </div>
              </div>

              {selectedTimesheet.total_hours > 50 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">
                    This timesheet exceeds 50 hours. Please verify the entries.
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Review Notes (required for rejection)</label>
                <Textarea
                  placeholder="Add notes for the employee..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectTimesheet}
              disabled={submitting || !reviewNotes}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button onClick={handleApproveTimesheet} disabled={submitting}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
