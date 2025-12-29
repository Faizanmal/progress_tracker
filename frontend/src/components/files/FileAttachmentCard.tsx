'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileAttachment, FileVersion } from '@/types';
import { 
  Download, 
  Eye, 
  MoreVertical, 
  Trash2, 
  History, 
  Share2, 
  FileIcon, 
  ImageIcon, 
  FileSpreadsheet, 
  FileText, 
  Code, 
  Archive,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileAttachmentCardProps {
  file: FileAttachment;
  versions?: FileVersion[];
  onDownload?: (id: string, version?: number) => void;
  onPreview?: (id: string) => void;
  onDelete?: (id: string) => void;
  onShare?: (id: string) => void;
  onRestoreVersion?: (fileId: string, versionId: string) => void;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  document: <FileText className="h-8 w-8 text-blue-500" />,
  image: <ImageIcon className="h-8 w-8 text-green-500" />,
  spreadsheet: <FileSpreadsheet className="h-8 w-8 text-emerald-500" />,
  presentation: <FileText className="h-8 w-8 text-orange-500" />,
  pdf: <FileText className="h-8 w-8 text-red-500" />,
  code: <Code className="h-8 w-8 text-purple-500" />,
  archive: <Archive className="h-8 w-8 text-amber-500" />,
  other: <FileIcon className="h-8 w-8 text-muted-foreground" />,
};

export function FileAttachmentCard({
  file,
  versions = [],
  onDownload,
  onPreview,
  onDelete,
  onShare,
  onRestoreVersion,
}: FileAttachmentCardProps) {
  const [showVersions, setShowVersions] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muted rounded-lg shrink-0">
            {fileTypeIcons[file.file_type] || fileTypeIcons.other}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h4 className="font-medium truncate" title={file.name}>
                  {file.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>{file.file_size_display || `${(file.file_size / 1024).toFixed(1)} KB`}</span>
                  <span>•</span>
                  <span>v{file.version}</span>
                  {file.version > 1 && (
                    <Badge variant="outline" className="text-xs">
                      <History className="w-3 h-3 mr-1" />
                      {file.version} versions
                    </Badge>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {file.preview_available && (
                    <DropdownMenuItem onClick={() => onPreview?.(file.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onDownload?.(file.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare?.(file.id)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  {file.version > 1 && (
                    <DropdownMenuItem onClick={() => setShowVersions(true)}>
                      <History className="mr-2 h-4 w-4" />
                      Version History
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(file.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Uploaded by {file.uploaded_by_name}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(file.created_at)}
            </span>
          </div>
          {file.virus_scanned && (
            <div className="flex items-center gap-1">
              {file.virus_scan_result === 'clean' ? (
                <>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">Scanned</span>
                </>
              ) : file.virus_scan_result === 'infected' ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-red-600">Warning</span>
                </>
              ) : null}
            </div>
          )}
        </div>
        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {file.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      {/* Version History Dialog */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              {file.name} has {versions.length || file.version} versions
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={cn(
                    'flex items-center justify-between p-3 border rounded-lg',
                    version.is_current && 'border-primary bg-primary/5'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Version {version.version_number}</span>
                      {version.is_current && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {version.uploaded_by_name} • {formatDate(version.created_at)}
                    </div>
                    {version.change_summary && (
                      <p className="text-sm">{version.change_summary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDownload?.(file.id, version.version_number)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {!version.is_current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRestoreVersion?.(file.id, version.id)}
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
