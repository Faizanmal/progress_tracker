'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileUploadProgress } from '@/types';
import { Upload, X, FileIcon, ImageIcon, FileSpreadsheet, Presentation, FileText, Code, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  document: <FileText className="h-8 w-8" />,
  image: <ImageIcon className="h-8 w-8" />,
  spreadsheet: <FileSpreadsheet className="h-8 w-8" />,
  presentation: <Presentation className="h-8 w-8" />,
  pdf: <FileText className="h-8 w-8 text-red-500" />,
  code: <Code className="h-8 w-8" />,
  archive: <Archive className="h-8 w-8" />,
  other: <FileIcon className="h-8 w-8" />,
};

function getFileType(file: File): keyof typeof fileTypeIcons {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mime = file.type;
  
  if (mime.startsWith('image/')) return 'image';
  if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext)) return 'document';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'spreadsheet';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'presentation';
  if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml', 'yaml', 'yml', 'md'].includes(ext)) return 'code';
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return 'archive';
  return 'other';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function FileUploader({
  onUpload,
  accept,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB default
  disabled = false,
  className,
}: FileUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(acceptedFiles.map(file => ({
      file_name: file.name,
      progress: 0,
      status: 'pending' as const,
    })));

    try {
      // Simulate progress updates
      for (let i = 0; i < acceptedFiles.length; i++) {
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'uploading' as const, progress: 10 } : p
        ));
      }
      
      await onUpload(acceptedFiles);
      
      setUploadProgress(prev => prev.map(p => ({ ...p, status: 'complete' as const, progress: 100 })));
      
      // Clear progress after a delay
      setTimeout(() => setUploadProgress([]), 2000);
    } catch (error) {
      setUploadProgress(prev => prev.map(p => ({
        ...p,
        status: 'error' as const,
        error_message: error instanceof Error ? error.message : 'Upload failed',
      })));
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled: disabled || isUploading,
  });

  const removeFromQueue = (index: number) => {
    setUploadProgress(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragActive && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          disabled && 'opacity-50 cursor-not-allowed',
          !isDragActive && !isDragReject && 'border-muted-foreground/25 hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className={cn(
            'h-10 w-10',
            isDragActive ? 'text-primary' : 'text-muted-foreground'
          )} />
          {isDragActive ? (
            <p className="text-primary font-medium">Drop files here...</p>
          ) : (
            <>
              <p className="font-medium">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Up to {maxFiles} files, max {formatFileSize(maxSize)} each
              </p>
            </>
          )}
        </div>
      </div>

      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((item, index) => (
            <div
              key={`${item.file_name}-${index}`}
              className="flex items-center gap-3 p-3 border rounded-lg"
            >
              <div className="text-muted-foreground">
                <FileIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{item.file_name}</p>
                  {item.status === 'error' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFromQueue(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {item.status === 'uploading' && (
                  <Progress value={item.progress} className="h-1 mt-2" />
                )}
                {item.status === 'error' && (
                  <p className="text-xs text-destructive mt-1">{item.error_message}</p>
                )}
                {item.status === 'complete' && (
                  <p className="text-xs text-green-600 mt-1">Upload complete</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
