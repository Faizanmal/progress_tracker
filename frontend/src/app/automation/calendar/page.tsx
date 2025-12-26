'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Switch } from '@/src/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/src/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { 
  Calendar, 
  Plus, 
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { calendarEventsApi } from '@/src/lib/api-client';
import type { CalendarEvent, ScheduleSuggestion } from '@/src/types';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { value: 'task_deadline', label: 'Task Deadline' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'reminder', label: 'Reminder' },
];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'meeting',
    start_time: '',
    end_time: '',
    all_day: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsData, suggestionsData] = await Promise.all([
        calendarEventsApi.list(),
        calendarEventsApi.getSuggestions(),
      ]);
      setEvents(eventsData);
      setSuggestions(suggestionsData.filter((s: ScheduleSuggestion) => !s.is_accepted && !s.is_dismissed));
    } catch (error) {
      toast.error('Failed to fetch calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await calendarEventsApi.create(formData);
      toast.success('Event created');
      setShowCreateDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const handleUpdate = async () => {
    if (!editingEvent) return;
    try {
      await calendarEventsApi.update(editingEvent.id, formData);
      toast.success('Event updated');
      setEditingEvent(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to update event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await calendarEventsApi.delete(id);
      toast.success('Event deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const handleSyncFromTasks = async () => {
    try {
      const result = await calendarEventsApi.syncFromTasks();
      toast.success(`Synced ${result.created || 0} events from tasks`);
      fetchData();
    } catch (error) {
      toast.error('Failed to sync from tasks');
    }
  };

  const handleAcceptSuggestion = async (id: string) => {
    try {
      await calendarEventsApi.acceptSuggestion(id);
      toast.success('Suggestion accepted');
      fetchData();
    } catch (error) {
      toast.error('Failed to accept suggestion');
    }
  };

  const handleDismissSuggestion = async (id: string) => {
    try {
      await calendarEventsApi.dismissSuggestion(id);
      toast.success('Suggestion dismissed');
      fetchData();
    } catch (error) {
      toast.error('Failed to dismiss suggestion');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'meeting',
      start_time: '',
      end_time: '',
      all_day: false,
    });
  };

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      start_time: event.start_time.slice(0, 16),
      end_time: event.end_time.slice(0, 16),
      all_day: event.all_day,
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'task_deadline':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'meeting':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'milestone':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const upcomingEvents = events
    .filter(e => new Date(e.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const pastEvents = events
    .filter(e => new Date(e.end_time) < new Date())
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar & Scheduling</h1>
          <p className="text-muted-foreground">
            Manage events and get smart scheduling suggestions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncFromTasks}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync from Tasks
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Event</DialogTitle>
                <DialogDescription>
                  Add a new event to your calendar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Event title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Event description..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.all_day}
                    onCheckedChange={(checked) => setFormData({ ...formData, all_day: checked })}
                  />
                  <Label>All Day Event</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start</Label>
                    <Input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End</Label>
                    <Input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scheduling Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle>Scheduling Suggestions</CardTitle>
            </div>
            <CardDescription>
              AI-powered suggestions to optimize your schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{suggestion.task_title}</p>
                    <p className="text-sm text-muted-foreground">
                      Suggested: {formatDateTime(suggestion.suggested_start)} - {formatDateTime(suggestion.suggested_end)}
                    </p>
                    <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                    {suggestion.conflicts_avoided.length > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        Avoids {suggestion.conflicts_avoided.length} conflict(s)
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{Math.round(suggestion.confidence_score * 100)}% confident</Badge>
                    <Button variant="outline" size="sm" onClick={() => handleAcceptSuggestion(suggestion.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDismissSuggestion(suggestion.id)}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => 
                new Date(e.start_time).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => {
                const eventDate = new Date(e.start_time);
                const today = new Date();
                const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                return eventDate >= today && eventDate <= weekFromNow;
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deadlines</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.event_type === 'task_deadline').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Synced Events</CardTitle>
            <RefreshCw className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.is_synced).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No upcoming events</h3>
                  <p className="text-muted-foreground mb-4">
                    Add events or sync from your tasks
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={handleSyncFromTasks}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync from Tasks
                    </Button>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Event
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                          {event.event_type_display || event.event_type}
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.all_day ? (
                              new Date(event.start_time).toLocaleDateString()
                            ) : (
                              `${formatDateTime(event.start_time)} - ${formatDateTime(event.end_time)}`
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.external_link && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={event.external_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(event)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastEvents.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No past events</h3>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {pastEvents.slice(0, 20).map((event) => (
                <Card key={event.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                          {event.event_type_display || event.event_type}
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(event.start_time)}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
