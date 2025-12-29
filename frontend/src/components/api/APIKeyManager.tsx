'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { APIKey, APIScope } from '@/types';
import { 
  Key, 
  Plus, 
  Copy, 
  MoreVertical, 
  Trash2, 
  Eye, 
  EyeOff,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface APIKeyManagerProps {
  apiKeys: APIKey[];
  onCreateKey: (data: Partial<APIKey>) => Promise<{ key: string }>;
  onDeleteKey: (id: string) => void;
  onToggleKey: (id: string, isActive: boolean) => void;
}

const scopeGroups = {
  Tasks: ['read:tasks', 'write:tasks'] as APIScope[],
  Projects: ['read:projects', 'write:projects'] as APIScope[],
  Users: ['read:users', 'write:users'] as APIScope[],
  Progress: ['read:progress', 'write:progress'] as APIScope[],
  Time: ['read:time', 'write:time'] as APIScope[],
  Files: ['read:files', 'write:files'] as APIScope[],
  Reports: ['read:reports', 'read:analytics'] as APIScope[],
  Admin: ['admin:all'] as APIScope[],
};

function formatDate(dateString?: string): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function APIKeyManager({ apiKeys, onCreateKey, onDeleteKey, onToggleKey }: APIKeyManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyData, setNewKeyData] = useState<Partial<APIKey>>({
    name: '',
    description: '',
    scopes: [],
    rate_limit_per_minute: 60,
    rate_limit_per_day: 10000,
    allowed_ips: [],
  });
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [ipInput, setIpInput] = useState('');

  const handleScopeToggle = (scope: APIScope) => {
    setNewKeyData(prev => {
      const scopes = prev.scopes || [];
      if (scopes.includes(scope)) {
        return { ...prev, scopes: scopes.filter(s => s !== scope) };
      } else {
        return { ...prev, scopes: [...scopes, scope] };
      }
    });
  };

  const handleSelectAllScopes = (groupScopes: APIScope[]) => {
    setNewKeyData(prev => {
      const currentScopes = prev.scopes || [];
      const allSelected = groupScopes.every(s => currentScopes.includes(s));
      if (allSelected) {
        return { ...prev, scopes: currentScopes.filter(s => !groupScopes.includes(s)) };
      } else {
        return { ...prev, scopes: [...new Set([...currentScopes, ...groupScopes])] };
      }
    });
  };

  const handleAddIp = () => {
    if (ipInput && !newKeyData.allowed_ips?.includes(ipInput)) {
      setNewKeyData(prev => ({
        ...prev,
        allowed_ips: [...(prev.allowed_ips || []), ipInput],
      }));
      setIpInput('');
    }
  };

  const handleRemoveIp = (ip: string) => {
    setNewKeyData(prev => ({
      ...prev,
      allowed_ips: prev.allowed_ips?.filter(i => i !== ip),
    }));
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const result = await onCreateKey(newKeyData);
      setCreatedKey(result.key);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
    }
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setCreatedKey(null);
    setNewKeyData({
      name: '',
      description: '',
      scopes: [],
      rate_limit_per_minute: 60,
      rate_limit_per_day: 10000,
      allowed_ips: [],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-muted-foreground">Manage API keys for third-party integrations</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* API Keys Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{key.name}</div>
                      {key.description && (
                        <div className="text-sm text-muted-foreground">{key.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {key.key_prefix}...
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.slice(0, 3).map(scope => (
                        <Badge key={scope} variant="secondary" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                      {key.scopes.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{key.scopes.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {formatDate(key.last_used_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={key.is_active}
                      onCheckedChange={(checked) => onToggleKey(key.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => onDeleteKey(key.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {apiKeys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No API keys yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {createdKey ? 'API Key Created' : 'Create API Key'}
            </DialogTitle>
            <DialogDescription>
              {createdKey 
                ? <>Make sure to copy your API key now. You won{"'"}t be able to see it again!</>
                : <>Create a new API key for third-party integrations</>
              }
            </DialogDescription>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                  <div>
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">
                      Copy your API key
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      This is the only time you{"'"}ll see this key. Store it securely.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <code className={cn(
                  'flex-1 p-3 bg-muted rounded font-mono text-sm break-all',
                  !showKey && 'blur-sm select-none'
                )}>
                  {createdKey}
                </code>
                <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" onClick={handleCopyKey}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newKeyData.name}
                    onChange={(e) => setNewKeyData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Production API Key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={newKeyData.description || ''}
                    onChange={(e) => setNewKeyData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What is this key used for?"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(scopeGroups).map(([group, scopes]) => (
                    <div key={group} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={scopes.every(s => newKeyData.scopes?.includes(s))}
                          onCheckedChange={() => handleSelectAllScopes(scopes)}
                        />
                        <Label className="font-medium">{group}</Label>
                      </div>
                      <div className="pl-6 space-y-1">
                        {scopes.map(scope => (
                          <div key={scope} className="flex items-center gap-2">
                            <Checkbox
                              checked={newKeyData.scopes?.includes(scope)}
                              onCheckedChange={() => handleScopeToggle(scope)}
                            />
                            <Label className="text-sm font-normal">{scope}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Rate Limits</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate_minute" className="text-sm font-normal">
                      Requests per minute
                    </Label>
                    <Input
                      id="rate_minute"
                      type="number"
                      value={newKeyData.rate_limit_per_minute}
                      onChange={(e) => setNewKeyData(prev => ({ 
                        ...prev, 
                        rate_limit_per_minute: parseInt(e.target.value) 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate_day" className="text-sm font-normal">
                      Requests per day
                    </Label>
                    <Input
                      id="rate_day"
                      type="number"
                      value={newKeyData.rate_limit_per_day}
                      onChange={(e) => setNewKeyData(prev => ({ 
                        ...prev, 
                        rate_limit_per_day: parseInt(e.target.value) 
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>IP Whitelist (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={ipInput}
                    onChange={(e) => setIpInput(e.target.value)}
                    placeholder="192.168.1.1"
                  />
                  <Button variant="outline" onClick={handleAddIp}>Add</Button>
                </div>
                {newKeyData.allowed_ips && newKeyData.allowed_ips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newKeyData.allowed_ips.map(ip => (
                      <Badge key={ip} variant="secondary" className="flex items-center gap-1">
                        {ip}
                        <button onClick={() => handleRemoveIp(ip)}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave empty to allow requests from any IP address
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {createdKey ? (
              <Button onClick={handleCloseDialog}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                <Button onClick={handleCreate} disabled={isCreating || !newKeyData.name}>
                  {isCreating ? 'Creating...' : 'Create Key'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
