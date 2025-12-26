"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { api } from "@/src/lib/api-client";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  UserPlus,
  FileText,
  Settings,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  data?: Record<string, unknown>;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/users/notifications/");
      setNotifications(response.data.results || response.data);
    } catch {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`/users/notifications/${notificationId}/read/`);
      setNotifications(
        notifications.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/users/notifications/read-all/");
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await api.delete(`/users/notifications/${notificationId}/`);
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete("/users/notifications/clear-all/");
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch {
      toast.error("Failed to clear notifications");
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      task_assigned: <UserPlus className="h-5 w-5 text-blue-500" />,
      task_completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      task_overdue: <AlertCircle className="h-5 w-5 text-red-500" />,
      mention: <MessageSquare className="h-5 w-5 text-purple-500" />,
      comment: <MessageSquare className="h-5 w-5 text-gray-500" />,
      deadline_reminder: <Clock className="h-5 w-5 text-yellow-500" />,
      progress_update: <FileText className="h-5 w-5 text-blue-500" />,
      system: <Info className="h-5 w-5 text-gray-500" />,
      error: <XCircle className="h-5 w-5 text-red-500" />,
    };
    return icons[type] || <Bell className="h-5 w-5 text-gray-500" />;
  };

  const getNotificationBadge = (type: string) => {
    const badges: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      task_assigned: { label: "Task", variant: "default" },
      task_completed: { label: "Completed", variant: "secondary" },
      task_overdue: { label: "Overdue", variant: "destructive" },
      mention: { label: "Mention", variant: "default" },
      comment: { label: "Comment", variant: "outline" },
      deadline_reminder: { label: "Reminder", variant: "secondary" },
      progress_update: { label: "Progress", variant: "outline" },
      system: { label: "System", variant: "outline" },
    };
    const config = badges[type] || { label: type, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Stay updated on your tasks and projects</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
          <Button
            variant="outline"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear all
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/settings")}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {filter === "unread" ? "No unread notifications" : "No notifications"}
                </h3>
                <p className="text-muted-foreground text-center">
                  {filter === "unread"
                    ? "You're all caught up! Check back later for new updates."
                    : "You don't have any notifications yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`transition-colors ${
                      !notification.is_read ? "bg-primary/5 border-primary/20" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold truncate">{notification.title}</h4>
                            {getNotificationBadge(notification.type)}
                            {!notification.is_read && (
                              <span className="h-2 w-2 bg-primary rounded-full shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {notification.action_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => (window.location.href = notification.action_url!)}
                            >
                              View
                            </Button>
                          )}
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Notification Categories Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Notification Summary</CardTitle>
          <CardDescription>Overview of your notification types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                type: "task_assigned",
                label: "Tasks",
                icon: <UserPlus className="h-5 w-5" />,
              },
              {
                type: "mention",
                label: "Mentions",
                icon: <MessageSquare className="h-5 w-5" />,
              },
              {
                type: "deadline_reminder",
                label: "Reminders",
                icon: <Clock className="h-5 w-5" />,
              },
              {
                type: "task_overdue",
                label: "Overdue",
                icon: <AlertCircle className="h-5 w-5" />,
              },
            ].map((category) => {
              const count = notifications.filter((n) => n.type === category.type).length;
              const unread = notifications.filter(
                (n) => n.type === category.type && !n.is_read
              ).length;
              return (
                <div key={category.type} className="p-3 bg-muted rounded-lg text-center">
                  <div className="flex justify-center mb-2">{category.icon}</div>
                  <p className="font-semibold">{count}</p>
                  <p className="text-sm text-muted-foreground">{category.label}</p>
                  {unread > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {unread} new
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
