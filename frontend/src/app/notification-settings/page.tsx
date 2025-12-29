"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Switch } from "@/src/components/ui/switch";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Zap,
  Filter,
  Check,
  X,
} from "lucide-react";
import { advancedNotificationsApi, notificationPreferencesApi } from "@/src/lib/api-client";

interface NotificationRule {
  id: string;
  name: string;
  event_type: string;
  conditions: Record<string, unknown>;
  channels: string[];
  is_active: boolean;
  created_at: string;
}

interface NotificationDelivery {
  id: string;
  notification: { title: string };
  channel: string;
  status: string;
  delivered_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface NotificationPreference {
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  digest_frequency: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  task_assigned: boolean;
  task_completed: boolean;
  task_overdue: boolean;
  progress_update: boolean;
  mention: boolean;
  comment: boolean;
}

interface PushSubscription {
  id: string;
  device_name: string;
  browser: string;
  created_at: string;
  last_used: string;
}

export default function NotificationSettingsPage() {
  const [activeTab, setActiveTab] = useState("preferences");
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [pushSubscriptions, setPushSubscriptions] = useState<PushSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "preferences":
          const prefs = await notificationPreferencesApi.get();
          setPreferences(prefs);
          break;
        case "rules":
          const rulesData = await advancedNotificationsApi.getRules();
          setRules(rulesData);
          break;
        case "history":
          const deliveriesData = await advancedNotificationsApi.getDeliveries();
          setDeliveries(deliveriesData);
          break;
        case "devices":
          const subsData = await advancedNotificationsApi.getPushSubscriptions();
          setPushSubscriptions(subsData);
          break;
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;
    setSaving(true);
    try {
      await notificationPreferencesApi.update(preferences);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRule = async (id: string, isActive: boolean) => {
    try {
      await advancedNotificationsApi.updateRule(id, { is_active: !isActive });
      fetchData();
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Delete this notification rule?")) return;
    try {
      await advancedNotificationsApi.deleteRule(id);
      fetchData();
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const handleRemoveDevice = async (id: string) => {
    if (!confirm("Remove this device?")) return;
    try {
      await advancedNotificationsApi.deletePushSubscription(id);
      fetchData();
    } catch (error) {
      console.error("Failed to remove device:", error);
    }
  };

  const updatePreference = (key: keyof NotificationPreference, value: boolean | string) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case "delivered": return <Check className="h-4 w-4 text-green-500" />;
      case "failed": return <X className="h-4 w-4 text-red-500" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground">
            Configure how and when you receive notifications
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="preferences">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Filter className="h-4 w-4 mr-2" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Smartphone className="h-4 w-4 mr-2" />
            Devices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : preferences ? (
            <>
              {/* Channels */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Channels</CardTitle>
                  <CardDescription>Choose how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.email_enabled}
                      onCheckedChange={(checked) => updatePreference("email_enabled", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Browser push notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.push_enabled}
                      onCheckedChange={(checked) => updatePreference("push_enabled", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Text message alerts</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.sms_enabled}
                      onCheckedChange={(checked) => updatePreference("sms_enabled", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label>In-App Notifications</Label>
                        <p className="text-sm text-muted-foreground">Notifications within the app</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.in_app_enabled}
                      onCheckedChange={(checked) => updatePreference("in_app_enabled", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Event Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Types</CardTitle>
                  <CardDescription>Select which events trigger notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label>Task Assigned</Label>
                      <Switch
                        checked={preferences.task_assigned}
                        onCheckedChange={(checked) => updatePreference("task_assigned", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label>Task Completed</Label>
                      <Switch
                        checked={preferences.task_completed}
                        onCheckedChange={(checked) => updatePreference("task_completed", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label>Task Overdue</Label>
                      <Switch
                        checked={preferences.task_overdue}
                        onCheckedChange={(checked) => updatePreference("task_overdue", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label>Progress Update</Label>
                      <Switch
                        checked={preferences.progress_update}
                        onCheckedChange={(checked) => updatePreference("progress_update", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label>Mentions</Label>
                      <Switch
                        checked={preferences.mention}
                        onCheckedChange={(checked) => updatePreference("mention", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <Label>Comments</Label>
                      <Switch
                        checked={preferences.comment}
                        onCheckedChange={(checked) => updatePreference("comment", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Digest & Quiet Hours */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Settings</CardTitle>
                  <CardDescription>Configure notification delivery preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Email Digest Frequency</Label>
                      <Select
                        value={preferences.digest_frequency}
                        onValueChange={(value) => updatePreference("digest_frequency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quiet Hours</Label>
                      <div className="flex gap-2">
                        <Input
                          type="time"
                          value={preferences.quiet_hours_start || ""}
                          onChange={(e) => updatePreference("quiet_hours_start", e.target.value)}
                          placeholder="Start"
                        />
                        <span className="self-center">to</span>
                        <Input
                          type="time"
                          value={preferences.quiet_hours_end || ""}
                          onChange={(e) => updatePreference("quiet_hours_end", e.target.value)}
                          placeholder="End"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        No notifications during quiet hours
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSavePreferences} disabled={saving}>
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              Failed to load preferences
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Notification Rules</CardTitle>
                <CardDescription>Create custom rules for notifications</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Rule
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No notification rules defined. Create a rule to customize notifications.
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)}
                        />
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline">{rule.event_type}</Badge>
                            <span>→</span>
                            {rule.channels.map((channel) => (
                              <Badge key={channel} variant="secondary">{channel}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery History</CardTitle>
              <CardDescription>Recent notification deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : deliveries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No delivery history available.
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveries.map((delivery) => (
                    <div key={delivery.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getDeliveryStatusIcon(delivery.status)}
                        <div>
                          <p className="font-medium text-sm">{delivery.notification?.title || "Notification"}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline">{delivery.channel}</Badge>
                            <span>{new Date(delivery.created_at).toLocaleString()}</span>
                          </div>
                          {delivery.error_message && (
                            <p className="text-xs text-red-500 mt-1">{delivery.error_message}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={delivery.status === "delivered" ? "default" : delivery.status === "failed" ? "destructive" : "secondary"}>
                        {delivery.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Devices</CardTitle>
              <CardDescription>Devices registered for push notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : pushSubscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No devices registered for push notifications</p>
                  <Button>Enable Push Notifications</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pushSubscriptions.map((sub) => (
                    <div key={sub.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{sub.device_name}</p>
                          <div className="text-xs text-muted-foreground">
                            <span>{sub.browser}</span>
                            <span className="mx-2">•</span>
                            <span>Last used: {new Date(sub.last_used).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveDevice(sub.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
