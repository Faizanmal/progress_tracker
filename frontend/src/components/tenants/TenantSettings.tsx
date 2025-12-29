'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tenant, TenantBranding } from '@/types';
import { 
  Building2, 
  Palette, 
  Upload, 
  Globe, 
  Shield,
  Users,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TenantSettingsProps {
  tenant: Tenant;
  branding?: TenantBranding;
  onSave: (tenant: Partial<Tenant>, branding?: Partial<TenantBranding>) => void;
  onLogoUpload?: (file: File, type: 'logo' | 'logo_dark' | 'favicon') => Promise<string>;
}

export function TenantSettings({ tenant, branding, onSave, onLogoUpload }: TenantSettingsProps) {
  const [tenantData, setTenantData] = useState<Partial<Tenant>>(tenant);
  const [brandingData, setBrandingData] = useState<Partial<TenantBranding>>(branding || {
    primary_color: '#0066cc',
    secondary_color: '#4a5568',
    accent_color: '#38a169',
    background_color: '#ffffff',
    text_color: '#1a202c',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(tenantData, brandingData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'logo_dark' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file || !onLogoUpload) return;

    try {
      const url = await onLogoUpload(file, type);
      if (type === 'logo') {
        setBrandingData(prev => ({ ...prev, logo_url: url }));
      } else if (type === 'logo_dark') {
        setBrandingData(prev => ({ ...prev, logo_dark_url: url }));
      } else {
        setBrandingData(prev => ({ ...prev, favicon_url: url }));
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspace Settings</h1>
          <p className="text-muted-foreground">Manage your workspace configuration and branding</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="domain" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Domain
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Information</CardTitle>
              <CardDescription>Basic details about your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  value={tenantData.name || ''}
                  onChange={(e) => setTenantData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Workspace URL</Label>
                <div className="flex items-center">
                  <span className="text-muted-foreground text-sm px-3 py-2 border border-r-0 rounded-l-md bg-muted">
                    app.progresstracker.com/
                  </span>
                  <Input
                    id="slug"
                    value={tenantData.slug || ''}
                    onChange={(e) => setTenantData(prev => ({ ...prev, slug: e.target.value }))}
                    className="rounded-l-none"
                    placeholder="my-company"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={tenantData.settings?.timezone || 'UTC'}
                    onChange={(e) => setTenantData(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, timezone: e.target.value }
                    }))}
                    placeholder="America/New_York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Input
                    id="currency"
                    value={tenantData.settings?.default_currency || 'USD'}
                    onChange={(e) => setTenantData(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, default_currency: e.target.value }
                    }))}
                    placeholder="USD"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_format">Date Format</Label>
                  <Input
                    id="date_format"
                    value={tenantData.settings?.date_format || 'MM/DD/YYYY'}
                    onChange={(e) => setTenantData(prev => ({ 
                      ...prev, 
                      settings: { ...prev.settings, date_format: e.target.value }
                    }))}
                    placeholder="MM/DD/YYYY"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Week Starts On</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={tenantData.settings?.week_start === 'sunday' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTenantData(prev => ({ 
                        ...prev, 
                        settings: { ...prev.settings, week_start: 'sunday' }
                      }))}
                    >
                      Sunday
                    </Button>
                    <Button
                      variant={tenantData.settings?.week_start === 'monday' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTenantData(prev => ({ 
                        ...prev, 
                        settings: { ...prev.settings, week_start: 'monday' }
                      }))}
                    >
                      Monday
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Identity</CardTitle>
              <CardDescription>Customize your workspace appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Main Logo */}
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {brandingData.logo_url ? (
                      <img 
                        src={brandingData.logo_url} 
                        alt="Logo" 
                        className="h-12 mx-auto mb-2"
                      />
                    ) : (
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="logo-upload"
                      onChange={(e) => handleLogoUpload(e, 'logo')}
                    />
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>Upload Logo</span>
                      </Button>
                    </Label>
                  </div>
                </div>

                {/* Dark Mode Logo */}
                <div className="space-y-2">
                  <Label>Logo (Dark Mode)</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center bg-gray-900">
                    {brandingData.logo_dark_url ? (
                      <img 
                        src={brandingData.logo_dark_url} 
                        alt="Dark Logo" 
                        className="h-12 mx-auto mb-2"
                      />
                    ) : (
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="logo-dark-upload"
                      onChange={(e) => handleLogoUpload(e, 'logo_dark')}
                    />
                    <Label htmlFor="logo-dark-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>Upload</span>
                      </Button>
                    </Label>
                  </div>
                </div>

                {/* Favicon */}
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {brandingData.favicon_url ? (
                      <img 
                        src={brandingData.favicon_url} 
                        alt="Favicon" 
                        className="h-8 w-8 mx-auto mb-2"
                      />
                    ) : (
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="favicon-upload"
                      onChange={(e) => handleLogoUpload(e, 'favicon')}
                    />
                    <Label htmlFor="favicon-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>Upload</span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Customize the color scheme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {[
                  { key: 'primary_color', label: 'Primary' },
                  { key: 'secondary_color', label: 'Secondary' },
                  { key: 'accent_color', label: 'Accent' },
                  { key: 'background_color', label: 'Background' },
                  { key: 'text_color', label: 'Text' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={(brandingData as Record<string, string>)[key] || '#000000'}
                        onChange={(e) => setBrandingData(prev => ({ 
                          ...prev, 
                          [key]: e.target.value 
                        }))}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={(brandingData as Record<string, string>)[key] || ''}
                        onChange={(e) => setBrandingData(prev => ({ 
                          ...prev, 
                          [key]: e.target.value 
                        }))}
                        className="flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 border rounded-lg">
                <h4 className="text-sm font-medium mb-3">Preview</h4>
                <div 
                  className="p-4 rounded-lg"
                  style={{ 
                    backgroundColor: brandingData.background_color,
                    color: brandingData.text_color 
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: brandingData.primary_color }}
                    />
                    <span className="font-bold">Your Workspace</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      style={{ 
                        backgroundColor: brandingData.primary_color,
                        color: '#ffffff'
                      }}
                    >
                      Primary Button
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      style={{ 
                        borderColor: brandingData.secondary_color,
                        color: brandingData.secondary_color
                      }}
                    >
                      Secondary
                    </Button>
                    <span 
                      className="inline-flex items-center px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: brandingData.accent_color,
                        color: '#ffffff'
                      }}
                    >
                      Accent Badge
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>Add custom CSS for advanced styling</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={brandingData.custom_css || ''}
                onChange={(e) => setBrandingData(prev => ({ ...prev, custom_css: e.target.value }))}
                placeholder="/* Add your custom CSS here */"
                rows={6}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain</CardTitle>
              <CardDescription>Use your own domain for your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={tenantData.domain || ''}
                  onChange={(e) => setTenantData(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="app.yourdomain.com"
                />
                <p className="text-xs text-muted-foreground">
                  Point your domain&apos;s CNAME record to: custom.progresstracker.com
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center">
                  <Input
                    id="subdomain"
                    value={tenantData.subdomain || ''}
                    onChange={(e) => setTenantData(prev => ({ ...prev, subdomain: e.target.value }))}
                    className="rounded-r-none"
                    placeholder="mycompany"
                  />
                  <span className="text-muted-foreground text-sm px-3 py-2 border border-l-0 rounded-r-md bg-muted">
                    .progresstracker.com
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
