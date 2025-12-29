'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AuditLog, AuditAction } from '@/types';
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Shield,
  RefreshCw,
  Upload,
  Globe,
  MoreHorizontal,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLogViewerProps {
  logs: AuditLog[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onExport?: () => void;
  onFilter?: (filters: AuditLogFilters) => void;
}

interface AuditLogFilters {
  search?: string;
  action?: AuditAction;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

const actionIcons: Partial<Record<AuditAction, React.ReactNode>> = {
  create: <Plus className="w-4 h-4 text-green-500" />,
  update: <Pencil className="w-4 h-4 text-blue-500" />,
  delete: <Trash2 className="w-4 h-4 text-red-500" />,
  view: <Eye className="w-4 h-4 text-gray-500" />,
  export: <Download className="w-4 h-4 text-purple-500" />,
  import: <Upload className="w-4 h-4 text-orange-500" />,
  login: <LogIn className="w-4 h-4 text-green-500" />,
  logout: <LogOut className="w-4 h-4 text-gray-500" />,
  permission_change: <Shield className="w-4 h-4 text-yellow-500" />,
  status_change: <RefreshCw className="w-4 h-4 text-blue-500" />,
  api_call: <Globe className="w-4 h-4 text-indigo-500" />,
};

const actionLabels: Record<AuditAction, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  view: 'Viewed',
  export: 'Exported',
  import: 'Imported',
  login: 'Logged in',
  logout: 'Logged out',
  permission_change: 'Changed permissions',
  status_change: 'Changed status',
  assignment_change: 'Changed assignment',
  bulk_action: 'Bulk action',
  api_call: 'API call',
  integration_sync: 'Integration sync',
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AuditLogEntry({ log, isExpanded, onToggle }: { 
  log: AuditLog; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasChanges = log.changes && log.changes.length > 0;

  return (
    <div className={cn(
      'border-b last:border-b-0 py-3',
      log.is_sensitive && 'bg-yellow-50 dark:bg-yellow-900/10'
    )}>
      <div 
        className="flex items-start gap-3 cursor-pointer"
        onClick={onToggle}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback>
            {log.user_name?.slice(0, 2).toUpperCase() || 'SY'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">
              {log.is_system_action ? 'System' : log.user_name || 'Unknown'}
            </span>
            <span className="text-muted-foreground">
              {actionLabels[log.action] || log.action}
            </span>
            <Badge variant="outline" className="text-xs">
              {log.entity_type || log.content_type}
            </Badge>
            <span className="font-medium text-primary">
              {log.entity_title || log.object_repr}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{formatTimestamp(log.timestamp)}</span>
            {log.ip_address && (
              <>
                <span>•</span>
                <span>{log.ip_address}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actionIcons[log.action] || <MoreHorizontal className="w-4 h-4" />}
          {hasChanges && (
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Changes */}
      {isExpanded && hasChanges && (
        <div className="mt-3 ml-11 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Changes:</div>
          <div className="space-y-1">
            {log.changes.map((change, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
              >
                <span className="font-medium min-w-[100px]">
                  {change.field_display || change.field}:
                </span>
                <span className="text-red-600 line-through">
                  {String(change.old_value ?? '(empty)')}
                </span>
                <span>→</span>
                <span className="text-green-600">
                  {String(change.new_value ?? '(empty)')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AuditLogViewer({
  logs,
  isLoading,
  onLoadMore,
  hasMore,
  onExport,
  onFilter,
}: AuditLogViewerProps) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleExpanded = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const filteredLogs = useMemo(() => {
    let result = logs;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(log =>
        log.user_name?.toLowerCase().includes(searchLower) ||
        log.object_repr?.toLowerCase().includes(searchLower) ||
        log.entity_title?.toLowerCase().includes(searchLower)
      );
    }

    if (actionFilter !== 'all') {
      result = result.filter(log => log.action === actionFilter);
    }

    return result;
  }, [logs, search, actionFilter]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              Track all changes and activities in your workspace
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="create">Created</SelectItem>
              <SelectItem value="update">Updated</SelectItem>
              <SelectItem value="delete">Deleted</SelectItem>
              <SelectItem value="login">Logins</SelectItem>
              <SelectItem value="permission_change">Permissions</SelectItem>
              <SelectItem value="api_call">API Calls</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log List */}
        <ScrollArea className="h-[500px]">
          <div className="space-y-1">
            {filteredLogs.map(log => (
              <AuditLogEntry
                key={log.id}
                log={log}
                isExpanded={expandedLogs.has(log.id)}
                onToggle={() => toggleExpanded(log.id)}
              />
            ))}

            {filteredLogs.length === 0 && !isLoading && (
              <div className="py-8 text-center text-muted-foreground">
                No audit logs found
              </div>
            )}

            {isLoading && (
              <div className="py-4 text-center">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Load More */}
        {hasMore && !isLoading && (
          <div className="text-center">
            <Button variant="outline" onClick={onLoadMore}>
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
