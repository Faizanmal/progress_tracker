"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Building2,
  Users,
  Palette,
  Mail,
  Shield,
  BarChart3,
  RefreshCw,
  Send,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Upload,
} from "lucide-react";
import { tenantsApi } from "@/src/lib/api-client";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
}

interface Branding {
  id: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  company_name: string;
  tagline: string;
  custom_css: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_by: { name: string } | null;
  created_at: string;
  expires_at: string;
}

interface AdminLog {
  id: string;
  user: { name: string } | null;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

interface UsageStats {
  id: string;
  period: string;
  users_count: number;
  projects_count: number;
  tasks_count: number;
  storage_used_mb: number;
  api_calls: number;
}

export default function TenantsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invitation form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tenants = await tenantsApi.list();
      if (tenants.length > 0) {
        setTenant(tenants[0]);
      }
      
      switch (activeTab) {
        case "branding":
          const brandingData = await tenantsApi.getBranding();
          setBranding(brandingData);
          break;
        case "invitations":
          const invitesData = await tenantsApi.getInvitations();
          setInvitations(invitesData);
          break;
        case "logs":
          const logsData = await tenantsApi.getAdminLogs();
          setAdminLogs(logsData);
          break;
        case "usage":
          const usageData = await tenantsApi.getUsageStats();
          setUsageStats(usageData);
          break;
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail) return;
    setSendingInvite(true);
    try {
      await tenantsApi.createInvitation({ email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      fetchData();
    } catch (error) {
      console.error("Failed to send invitation:", error);
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvitation = async (id: string) => {
    try {
      await tenantsApi.cancelInvitation(id);
      fetchData();
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
    }
  };

  const handleResendInvitation = async (id: string) => {
    try {
      await tenantsApi.resendInvitation(id);
      fetchData();
    } catch (error) {
      console.error("Failed to resend invitation:", error);
    }
  };

  const getInvitationStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "accepted": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "expired": return <XCircle className="h-4 w-4 text-red-500" />;
      case "cancelled": return <X className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization, branding, and team
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Building2 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Mail className="h-4 w-4 mr-2" />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Shield className="h-4 w-4 mr-2" />
            Admin Logs
          </TabsTrigger>
          <TabsTrigger value="usage">
            <BarChart3 className="h-4 w-4 mr-2" />
            Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Basic information about your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tenant ? (
                  <>
                    <div>
                      <Label>Organization Name</Label>
                      <Input value={tenant.name} readOnly className="mt-1" />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input value={tenant.slug} readOnly className="mt-1" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Status</Label>
                        <p className="text-sm text-muted-foreground">Organization active status</p>
                      </div>
                      <Badge variant={tenant.is_active ? "default" : "secondary"}>
                        {tenant.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading organization details...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Plan</CardTitle>
                <CardDescription>Your current plan and limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tenant ? (
                  <>
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <p className="text-2xl font-bold capitalize">{tenant.plan}</p>
                      <p className="text-sm text-muted-foreground">Current Plan</p>
                    </div>
                    <Button className="w-full">Upgrade Plan</Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Customization</CardTitle>
              <CardDescription>Customize the look and feel of your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Company Name</Label>
                      <Input
                        value={branding?.company_name || ""}
                        placeholder="Your Company"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Tagline</Label>
                      <Input
                        value={branding?.tagline || ""}
                        placeholder="Your tagline here"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Primary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={branding?.primary_color || "#3b82f6"}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={branding?.primary_color || "#3b82f6"}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Secondary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={branding?.secondary_color || "#1e40af"}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={branding?.secondary_color || "#1e40af"}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Logo</Label>
                      <div className="mt-1 border-2 border-dashed rounded-lg p-8 text-center">
                        {branding?.logo_url ? (
                          <img src={branding.logo_url} alt="Logo" className="h-16 mx-auto" />
                        ) : (
                          <div className="text-muted-foreground">
                            <Upload className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Click to upload logo</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Favicon</Label>
                      <div className="mt-1 border-2 border-dashed rounded-lg p-8 text-center">
                        {branding?.favicon_url ? (
                          <img src={branding.favicon_url} alt="Favicon" className="h-8 mx-auto" />
                        ) : (
                          <div className="text-muted-foreground">
                            <Upload className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Click to upload favicon</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>Save Changes</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invite Team Members</CardTitle>
              <CardDescription>Send invitations to join your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Email address"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <Button onClick={handleSendInvitation} disabled={sendingInvite}>
                  <Send className="h-4 w-4 mr-2" />
                  {sendingInvite ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>Manage sent invitations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invitations sent yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invite) => (
                    <div key={invite.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getInvitationStatusIcon(invite.status)}
                        <div>
                          <p className="font-medium">{invite.email}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline">{invite.role}</Badge>
                            <span>Sent {new Date(invite.created_at).toLocaleDateString()}</span>
                            {invite.invited_by && <span>by {invite.invited_by.name}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={invite.status === "pending" ? "default" : "secondary"}>
                          {invite.status}
                        </Badge>
                        {invite.status === "pending" && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleResendInvitation(invite.id)}>
                              Resend
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleCancelInvitation(invite.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Activity Log</CardTitle>
              <CardDescription>Track administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : adminLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No admin activity recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {adminLogs.map((log) => (
                    <div key={log.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-muted-foreground">{log.details}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{log.user?.name || "System"}</p>
                          <p>{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats[0]?.users_count || 0}
                </div>
                <p className="text-xs text-muted-foreground">Active users</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projects</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats[0]?.projects_count || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats[0]?.tasks_count || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total tasks</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((usageStats[0]?.storage_used_mb || 0) / 1024).toFixed(2)} GB
                </div>
                <p className="text-xs text-muted-foreground">Storage used</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage History</CardTitle>
              <CardDescription>Monthly usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : usageStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No usage data available.
                </div>
              ) : (
                <div className="space-y-3">
                  {usageStats.map((stat) => (
                    <div key={stat.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{stat.period}</p>
                        <Badge variant="outline">{stat.api_calls.toLocaleString()} API calls</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Users</p>
                          <p className="font-medium">{stat.users_count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Projects</p>
                          <p className="font-medium">{stat.projects_count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tasks</p>
                          <p className="font-medium">{stat.tasks_count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Storage</p>
                          <p className="font-medium">{stat.storage_used_mb} MB</p>
                        </div>
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
