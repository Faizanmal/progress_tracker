'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarConnection } from '@/types';
import { Plus, Calendar } from 'lucide-react';

type CalendarProvider = 'google' | 'outlook' | 'apple' | 'caldav';

interface CalendarConnectDialogProps {
  trigger?: React.ReactNode;
  onConnect?: (data: Partial<CalendarConnection>) => Promise<void>;
}

const providers = [
  { value: 'google' as const, label: 'Google Calendar', description: 'Connect your Google Workspace calendar' },
  { value: 'outlook' as const, label: 'Microsoft Outlook', description: 'Connect your Outlook or Microsoft 365 calendar' },
  { value: 'apple' as const, label: 'Apple iCloud', description: 'Connect your iCloud calendar' },
  { value: 'caldav' as const, label: 'CalDAV Server', description: 'Connect to any CalDAV-compatible calendar' },
];

export function CalendarConnectDialog({ trigger, onConnect }: CalendarConnectDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedProvider, setSelectedProvider] = useState<CalendarProvider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState({
    name: '',
    sync_tasks: true,
    sync_milestones: true,
    sync_deadlines: true,
    two_way_sync: false,
    caldav_url: '',
    caldav_username: '',
    caldav_password: '',
  });

  const handleProviderSelect = (provider: CalendarProvider) => {
    setSelectedProvider(provider);
    setConfig(prev => ({
      ...prev,
      name: `${providers.find(p => p.value === provider)?.label} Calendar`,
    }));
    setStep('configure');
  };

  const handleConnect = async () => {
    if (!selectedProvider) return;
    
    setIsSubmitting(true);
    try {
      await onConnect?.({
        provider: selectedProvider,
        name: config.name,
        sync_tasks: config.sync_tasks,
        sync_milestones: config.sync_milestones,
        sync_deadlines: config.sync_deadlines,
        two_way_sync: config.two_way_sync,
      });
      setOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('select');
    setSelectedProvider(null);
    setConfig({
      name: '',
      sync_tasks: true,
      sync_milestones: true,
      sync_deadlines: true,
      two_way_sync: false,
      caldav_url: '',
      caldav_username: '',
      caldav_password: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => {
      setOpen(o);
      if (!o) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Connect Calendar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Calendar</DialogTitle>
          <DialogDescription>
            {step === 'select' 
              ? 'Choose a calendar provider to sync with your tasks and milestones.'
              : 'Configure your calendar sync preferences.'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'select' ? (
          <div className="grid gap-3 py-4">
            {providers.map((provider) => (
              <button
                key={provider.value}
                onClick={() => handleProviderSelect(provider.value)}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div className="p-2 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{provider.label}</div>
                  <div className="text-sm text-muted-foreground">{provider.description}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Calendar Name</Label>
              <Input
                id="name"
                value={config.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Work Calendar"
              />
            </div>

            {selectedProvider === 'caldav' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="caldav_url">CalDAV Server URL</Label>
                  <Input
                    id="caldav_url"
                    type="url"
                    value={config.caldav_url}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig(prev => ({ ...prev, caldav_url: e.target.value }))}
                    placeholder="https://calendar.example.com/caldav/"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="caldav_username">Username</Label>
                    <Input
                      id="caldav_username"
                      value={config.caldav_username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig(prev => ({ ...prev, caldav_username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caldav_password">Password</Label>
                    <Input
                      id="caldav_password"
                      type="password"
                      value={config.caldav_password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig(prev => ({ ...prev, caldav_password: e.target.value }))}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-3 pt-2">
              <Label className="text-base">Sync Options</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sync_tasks" className="font-normal">Sync tasks</Label>
                  <Switch
                    id="sync_tasks"
                    checked={config.sync_tasks}
                    onCheckedChange={(checked: boolean) => setConfig(prev => ({ ...prev, sync_tasks: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sync_milestones" className="font-normal">Sync milestones</Label>
                  <Switch
                    id="sync_milestones"
                    checked={config.sync_milestones}
                    onCheckedChange={(checked: boolean) => setConfig(prev => ({ ...prev, sync_milestones: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sync_deadlines" className="font-normal">Sync deadlines</Label>
                  <Switch
                    id="sync_deadlines"
                    checked={config.sync_deadlines}
                    onCheckedChange={(checked: boolean) => setConfig(prev => ({ ...prev, sync_deadlines: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="two_way_sync" className="font-normal">Two-way sync</Label>
                  <Switch
                    id="two_way_sync"
                    checked={config.two_way_sync}
                    onCheckedChange={(checked: boolean) => setConfig(prev => ({ ...prev, two_way_sync: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'configure' && (
            <Button variant="outline" onClick={() => setStep('select')}>
              Back
            </Button>
          )}
          <Button
            onClick={handleConnect}
            disabled={step === 'select' || isSubmitting}
          >
            {isSubmitting ? 'Connecting...' : 'Connect Calendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
